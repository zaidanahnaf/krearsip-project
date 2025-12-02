from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from jose import jwt

from app.core.config import settings
from app.db.session import get_session
from app.schemas.works import WorkCreate, WorkOnChainUpdate, WorkPublic  # pastikan ini ada
from app.services.work_service import WorkService

router = APIRouter(prefix="/works", tags=["works"])
security = HTTPBearer()


def _looks_like_uuid(s: str) -> bool:
    return isinstance(s, str) and len(s) == 36 and "-" in s


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
):
    """
    Decode JWT:
    - Kalau sub sudah UUID -> langsung pakai
    - Kalau sub masih 0x... (wallet lama) -> map ke tabel `pengguna` via alamat_wallet
    """
    try:
        payload = jwt.decode(
            creds.credentials,
            settings.JWT_SECRET,
            audience=settings.JWT_AUD,
            issuer=settings.JWT_ISS,
        )
        sub = payload.get("sub")
        wallet = (payload.get("wallet") or "").lower()

        # 1) Sudah UUID? langsung gas
        if sub and _looks_like_uuid(sub):
            return {
                "user_id": sub,
                "wallet": wallet or None,
                "peran": payload.get("peran", "pencipta"),
            }

        # 2) sub masih alamat wallet (token versi awal)
        addr = (wallet or sub or "").lower()
        if not addr.startswith("0x"):
            raise HTTPException(status_code=401, detail="Format token tidak dikenali")

        # Cari user di tabel `pengguna`
        q_sel = text(
            """
            SELECT id, peran
            FROM pengguna
            WHERE lower(alamat_wallet) = :w
            LIMIT 1
            """
        )
        row = (await session.execute(q_sel, {"w": addr})).mappings().first()

        if row:
            user_id = row["id"]
            peran = row["peran"]
        else:
            # Kalau belum ada, buat user baru
            q_ins = text(
                """
                INSERT INTO pengguna (alamat_wallet)
                VALUES (:w)
                RETURNING id, peran
                """
            )
            new_row = (await session.execute(q_ins, {"w": addr})).mappings().one()
            await session.commit()
            user_id = new_row["id"]
            peran = new_row["peran"]

        return {
            "user_id": str(user_id),
            "wallet": addr,
            "peran": peran,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token tidak valid: {e}")


# =========== ENDPOINT KREATOR ===========


@router.get("", summary="List karya milik user")
async def list_works(
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    try:
        # Hitung total
        q_total = text(
            """
            SELECT COUNT(*) AS cnt
            FROM karya
            WHERE pengguna_id = :uid
            """
        )
        rs_total = await session.execute(q_total, {"uid": user["user_id"]})
        total = rs_total.scalar_one()

        # Ambil list item
        q_list = text("""
            SELECT
                k.id::text AS id,
                k.judul,
                k.status,
                k.tx_hash,
                k.jaringan_ket,
                k.block_number,
                k.updated_at,
                CASE
                    WHEN k.jaringan_ket = 'sepolia'
                    AND k.tx_hash ~* '^0x[0-9a-f]{64}$'
                    THEN 'https://sepolia.etherscan.io/tx/' || lower(k.tx_hash)
                    ELSE NULL
                END AS etherscan_url
            FROM karya k
            WHERE k.pengguna_id = :uid
            ORDER BY k.updated_at DESC
            LIMIT :limit OFFSET :offset
        """)
        rs_list = await session.execute(
            q_list,
            {"uid": user["user_id"], "limit": limit, "offset": offset},
        )
        items = rs_list.mappings().all()

        return {"items": items, "total": total, "limit": limit, "offset": offset}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error in list_works: {e}",
        )

@router.post("", summary="Buat karya draft")
async def create_work(
    body: WorkCreate,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Buat draft karya baru untuk user saat ini.
    """
    try:
        row = await WorkService.create_draft(
            session,
            user["user_id"],  # sudah dijamin UUID dari get_current_user
            body.judul,
            body.hash_berkas,
        )
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{karya_id}/onchain", summary="Update status on-chain")
async def update_on_chain(
    karya_id: str,
    body: WorkOnChainUpdate,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        row = await WorkService.update_on_chain(
            session,
            user["user_id"],
            karya_id,
            body.tx_hash,
            body.alamat_kontrak,
            body.jaringan_ket,
            body.waktu_blok,
        )
        if not row:
            raise HTTPException(
                status_code=404, detail="Karya tidak ditemukan / bukan milik Anda"
            )
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{karya_id}", response_model=WorkPublic, summary="Detail karya milik user")
async def get_work_detail(
    karya_id: str,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Detail karya milik user (versi private, tapi saat ini shape-nya sama WorkPublic).
    """
    try:
        q = text(
            """
            SELECT
                k.id::text AS id,
                k.judul,
                k.hash_berkas,
                k.status,
                k.tx_hash,
                k.alamat_kontrak,
                k.jaringan_ket,
                k.block_number,
                k.waktu_blok,
                k.updated_at,
                CASE
                    WHEN k.jaringan_ket = 'sepolia'
                         AND k.tx_hash ~* '^0x[0-9a-f]{64}$'
                    THEN 'https://sepolia.etherscan.io/tx/' || lower(k.tx_hash)
                    ELSE NULL
                END AS etherscan_url
            FROM karya k
            WHERE k.id = :kid
                AND k.pengguna_id = :uid
            LIMIT 1
            """
        )
        row = (
            await session.execute(
                q, {"kid": karya_id, "uid": user["user_id"]}
            )
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="Karya tidak ditemukan")

        # WorkPublic expects dict-like
        return WorkPublic(**dict(row))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Unexpected error in get_work_detail: {e}"
        )
