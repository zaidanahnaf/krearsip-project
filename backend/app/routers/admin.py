# app/routers/admin.py
import queue
from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from jose import jwt
import httpx
from datetime import datetime, timezone

from app.core.config import settings
from app.db.session import get_session
# from app.routers.works import get_current_user
from app.routers.auth import get_admin_user
from app.schemas.admin_works import AdminWorksListResponse, AdminWorkItem, AdminWorkCreator, AdminWorkVerifier, RejectBody
# from app.blockchain.krearsip import send_register_tx
from app.services.onchain import send_register_tx_for_karya, sync_tx_for_karya    
# from app.blockchain.krearsip import w3

router = APIRouter(prefix="/admin", tags=["admin"])
security = HTTPBearer()


STATUS_DRAFT = "draft"
STATUS_ON_CHAIN = "on_chain"
STATUS_TERVERIFIKASI = "terverifikasi"

ONCHAIN_TIDAK_ADA = "tidak ada"
ONCHAIN_DALAM_ANTRIAN = "dalam antrian"
ONCHAIN_MENUNGGU = "menunggu"
ONCHAIN_BERHASIL = "berhasil"
ONCHAIN_GAGAL = "gagal"

# --- Helper: auth & peran check ---

# async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
#     try:
#         payload = jwt.decode(
#             creds.credentials,
#             settings.JWT_SECRET,
#             audience=settings.JWT_AUD,
#             issuer=settings.JWT_ISS,
#         )
#         return {"user_id": payload["sub"], "wallet": payload["wallet"]}
#     except Exception as e:
#         raise HTTPException(status_code=401, detail=f"Token tidak valid: {e}")


# async def ensure_verifikator_or_admin(
#     user=Depends(get_current_user),
#     session: AsyncSession = Depends(get_session),
# ):
#     q = text("SELECT peran FROM pengguna WHERE id = :uid LIMIT 1")
#     rs = await session.execute(q, {"uid": user["user_id"]})
#     peran = rs.scalar_one_or_none()

#     if peran not in ("verifikator", "admin"):
#         raise HTTPException(
#             status_code=403,
#             detail="Hanya verifikator / admin yang boleh sync dari chain",
#         )
#     return user


# --- Helper: call RPC Sepolia ---

async def fetch_tx_receipt(tx_hash: str):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                settings.SEPOLIA_RPC,
                json={
                    "jsonrpc": "2.0",
                    "method": "eth_getTransactionReceipt",
                    "params": [tx_hash],
                    "id": 1,
                },
            )
    except httpx.RequestError as e:
        # Masalah jaringan / DNS / dll
        raise HTTPException(status_code=502, detail=f"RPC connection error: {e}")

    # Respon HTTP 200 dan JSON
    if resp.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"RPC HTTP {resp.status_code}: {resp.text[:200]}",
        )

    try:
        data = resp.json()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"RPC response is not JSON: {e}; body={resp.text[:200]}",
        )

    if "error" in data:
        raise HTTPException(status_code=400, detail=f"RPC error: {data['error']}")
    return data.get("result")


async def fetch_block(block_number_hex: str):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                settings.SEPOLIA_RPC,
                json={
                    "jsonrpc": "2.0",
                    "method": "eth_getBlockByNumber",
                    "params": [block_number_hex, False],
                    "id": 2,
                },
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"RPC connection error: {e}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"RPC HTTP {resp.status_code}: {resp.text[:200]}",
        )

    try:
        data = resp.json()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"RPC response is not JSON: {e}; body={resp.text[:200]}",
        )

    if "error" in data:
        raise HTTPException(status_code=400, detail=f"RPC error: {data['error']}")
    return data.get("result")

@router.get("/debug/rpc", summary="Lihat RPC yang dipakai backend")
async def debug_rpc():
    return {"sepolia_rpc": settings.SEPOLIA_RPC}

# --- Endpoint utama: /admin/sync-tx/{tx_hash} ---
@router.post("/sync-tx/{tx_hash}", summary="Sync 1 transaksi dari Sepolia ke DB")
async def admin_sync_tx(
    tx_hash: str,
    user=Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    # cari karya berdasarkan tx_hash
    rs = await session.execute(
        text("SELECT id FROM karya WHERE tx_hash = :tx LIMIT 1"),
        {"tx": tx_hash.strip()},
    )
    row = rs.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Karya dengan tx_hash tersebut tidak ditemukan")

    karya_id = row["id"]

    rs2 = await session.execute(
        text("""
            SELECT status, status_onchain
            FROM karya
            WHERE id = :id
        """),
        {"id": karya_id},
    )
    st = rs2.mappings().first()
    if not st:
        raise HTTPException(status_code=404, detail="Karya tidak ditemukan")

    if st["status"] != STATUS_ON_CHAIN:
        raise HTTPException(
            status_code=400,
            detail=f"Karya belum on_chain (status sekarang: {st['status']}). Jalankan deploy dulu."
        )

    try:
        data = await sync_tx_for_karya(str(karya_id), session)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal sync transaksi: {e}")

    return data 


@router.post("/works/{karya_id}/verify", summary="Verifikasi karya (oleh verifikator/admin)")
async def verify_work(
    karya_id: str,
    user = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Ubah status karya dari 'on_chain' -> 'terverifikasi'.
    Syarat:
    - status sekarang harus 'on_chain'
    - block_number TIDAK boleh NULL (sudah disync dari chain)
    """
    try:
        rs = await session.execute(
            text("""
                SELECT id, judul, status, block_number, status_onchain
                FROM karya
                WHERE id = :id
                FOR UPDATE
            """),
            {"id": karya_id},
        )
        row = rs.mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Karya tidak ditemukan")

        if row["status"] != STATUS_ON_CHAIN:
            raise HTTPException(
                status_code=400,
                detail=f"Hanya karya berstatus 'on_chain' yang bisa diverifikasi (status sekarang: {row['status']})",
            )

        if row["block_number"] is None:
            raise HTTPException(
                status_code=400,
                detail="Karya belum punya block_number, jalankan sync-tx dulu",
            )

        rs2 = await session.execute(
            text("""
                UPDATE karya
                SET status      = :status_baru,
                    verified_at = NOW(),
                    verified_by = :uid,
                    updated_at  = NOW()
                WHERE id = :id
                RETURNING id, judul, status, tx_hash, jaringan_ket,
                          block_number, waktu_blok, verified_at, verified_by, updated_at
            """),
            {
                "id": karya_id,
                "uid": user["user_id"],
                "status_baru": STATUS_TERVERIFIKASI,
            },
        )
        new_row = rs2.mappings().first()
        await session.commit()
        return new_row
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error in verify_work: {e}")
    
    
@router.get("/works", response_model=AdminWorksListResponse, summary="List karya untuk verifikator/admin")
async def admin_list_works(
    status: Optional[str] = Query(None, description="Filter langsung by status_karya"),
    queue: Optional[str] = Query(
        None,
        description="draft | draft_review | onchain | ready_deploy | verified",
    ),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user=Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    
    # ------------------------------------------------------------------
    # Bangun WHERE clause dinamis: kombinasi status + status_onchain
    # ------------------------------------------------------------------
    where_parts: list[str] = ["1=1"]
    params: dict[str, Any] = {}

    # optional filter status langsung (kalau mau)
    if status:
        where_parts.append("k.status = :status_filter")
        params["status_filter"] = status

    if queue:
        # support alias lama dari FE: draft_review & ready_deploy
        if queue in ("draft", "draft_review"):
            # Antrian Review (Draft):
            # - status = draft
            # - status_onchain: 'tidak ada' atau 'gagal'
            where_parts.append("k.status = :status_draft")
            where_parts.append("k.status_onchain IN ('tidak ada', 'gagal')")
            params["status_draft"] = STATUS_DRAFT

        elif queue in ("onchain", "ready_deploy"):
            # Antrian On-chain:
            # - status = draft
            # - status_onchain = 'menunggu'
            where_parts.append("k.status = :status_draft_onchain")
            where_parts.append("k.status_onchain = :status_onchain_menunggu")
            params["status_draft_onchain"] = STATUS_DRAFT
            params["status_onchain_menunggu"] = ONCHAIN_MENUNGGU

        elif queue == "verified":
            # Sudah On-chain:
            # - status = on_chain atau terverifikasi
            where_parts.append("k.status IN ('on_chain', 'terverifikasi')")

        else:
            raise HTTPException(status_code=400, detail="queue tidak valid")

    where_clause = " AND ".join(where_parts)

    # ------------------------------------------------------------------
    # SQL template (COUNT dan SELECT data)
    # ------------------------------------------------------------------
    base_from = f"""
        FROM karya k
        JOIN pengguna c ON c.id = k.pengguna_id
        LEFT JOIN pengguna v ON v.id = k.verified_by
        WHERE {where_clause}
    """

    count_sql = text("SELECT COUNT(*) " + base_from)

    data_sql = text(
        """
        SELECT
            k.id,
            k.judul,
            k.status,
            k.status_onchain,
            k.jaringan_ket,
            k.tx_hash,
            k.block_number,
            k.created_at,
            k.updated_at,
            k.verified_at,
            k.alasan_penolakan,

            c.id AS creator_id,
            COALESCE(c.nama_tampil, c.email, c.alamat_wallet) AS creator_nama_tampil,
            c.alamat_wallet AS creator_wallet,

            v.id AS verifier_id,
            COALESCE(v.nama_tampil, v.email) AS verifier_nama_tampil
        """ + base_from + """
        ORDER BY k.created_at DESC
        LIMIT :limit OFFSET :offset
        """
    )

    # param limit/offset
    params["limit"] = limit
    params["offset"] = offset

    # ------------------------------------------------------------------
    # Eksekusi query
    # ------------------------------------------------------------------
    total = (await session.execute(count_sql, params)).scalar_one()

    rs = await session.execute(data_sql, params)
    rows = rs.mappings().all()

    items: list[AdminWorkItem] = []

    for row in rows:
        creator = AdminWorkCreator(
            id=row["creator_id"],
            nama_tampil=row["creator_nama_tampil"],
            alamat_wallet=row["creator_wallet"],
        )

        verifier = None
        if row["verifier_id"]:
            verifier = AdminWorkVerifier(
                id=row["verifier_id"],
                nama_tampil=row["verifier_nama_tampil"],
            )

        item = AdminWorkItem(
            id=row["id"],
            judul=row["judul"],
            status=row["status"],
            status_onchain=row["status_onchain"],
            jaringan_ket=row["jaringan_ket"],
            tx_hash=row["tx_hash"],
            block_number=row["block_number"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            verified_at=row["verified_at"],
            alasan_penolakan=row["alasan_penolakan"],
            creator=creator,
            verifier=verifier,
        )
        items.append(item)

    return AdminWorksListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/works/{karya_id}/approve", summary="Approve draft work")
async def approve_work(
    karya_id: str,
    user=Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Approve draft:
    - status tetap 'draft'
    - status_onchain di-set 'menunggu' (siap deploy)
    """
    try:
        # Lock row dulu
        rs = await session.execute(
            text("""
                SELECT id, judul, status, status_onchain
                FROM karya 
                WHERE id = :id 
                FOR UPDATE
            """),
            {"id": karya_id},
        )
        row = rs.mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Karya tidak ditemukan")

        if row["status"] != STATUS_DRAFT:
            raise HTTPException(
                status_code=400,
                detail=f"Hanya karya draft yang bisa diapprove (status: {row['status']})",
            )

        # Update status_onchain -> menunggu
        rs_update = await session.execute(
            text("""
                UPDATE karya
                SET status_onchain = :status_onchain,
                    updated_at     = NOW()
                WHERE id = :id
                RETURNING id, judul, status, status_onchain, alasan_penolakan,
                          jaringan_ket, tx_hash, block_number,
                          created_at, updated_at, verified_at, verified_by
            """),
            {
                "id": karya_id,
                "status_onchain": ONCHAIN_MENUNGGU,
            },
        )
        updated = rs_update.mappings().first()

        # catatan audit
        await session.execute(
            text("""
                INSERT INTO catatan_audit(pengguna_id, aksi, muatan)
                VALUES (:uid, 'KARYA DISETUJUI', 
                        jsonb_build_object('karya_id', CAST(:kid AS text)))
            """),
            {"uid": user["user_id"], "kid": karya_id},
        )

        await session.commit()
        return updated

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error in approve_work: {e}")
    

@router.post("/works/{karya_id}/reject", summary="Reject draft work")
async def reject_work(
    karya_id: str,
    body: RejectBody | None = None,
    user=Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Reject draft work:
    - status tetap 'draft'
    - status_onchain = 'gagal'
    - opsional: isi alasan_penolakan
    """
    try:
        rs = await session.execute(
            text("""
                SELECT id, judul, status, status_onchain
                FROM karya
                WHERE id = :id
                FOR UPDATE
            """),
            {"id": karya_id},
        )
        row = rs.mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Karya tidak ditemukan")

        if row["status"] != STATUS_DRAFT:
            raise HTTPException(
                status_code=400,
                detail=f"Hanya karya draft yang bisa ditolak (status: {row['status']})",
            )

        reason = body.reason if body else None

        rs_update = await session.execute(
            text("""
                UPDATE karya
                SET status_onchain   = :status_onchain,
                    alasan_penolakan = COALESCE(:reason, alasan_penolakan),
                    updated_at       = NOW()
                WHERE id = :id
                RETURNING id, judul, status, status_onchain, alasan_penolakan,
                          jaringan_ket, tx_hash, block_number,
                          created_at, updated_at, verified_at, verified_by
            """),
            {
                "id": karya_id,
                "status_onchain": ONCHAIN_GAGAL,
                "reason": reason,
            },
        )
        updated = rs_update.mappings().first()

        await session.execute(
            text("""
                INSERT INTO catatan_audit(pengguna_id, aksi, muatan)
                VALUES (:uid, 'KARYA DITOLAK', 
                        jsonb_build_object('karya_id', CAST(:kid AS text)))
            """),
            {"uid": user["user_id"], "kid": karya_id},
        )

        await session.commit()
        return updated

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error in reject_work: {e}")


@router.post("/works/{karya_id}/deploy", summary="Trigger blockchain deployment")
async def admin_deploy_work(
    karya_id: UUID,
    user=Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Trigger deployment ke chain untuk 1 karya:
    - hanya boleh untuk karya draft + status_onchain='menunggu'
    - pakai registrar account backend
    """
    try:
        tx_hash = await send_register_tx_for_karya(karya_id, session)
    except ValueError as e:
        # error terkontrol (validasi, dll)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # error tak terduga dari web3 / RPC
        raise HTTPException(status_code=500, detail=f"Gagal mengirim transaksi: {e}")

    return {
        "karya_id": karya_id,
        "tx_hash": tx_hash,
        "status_onchain": "menunggu",
    }