from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from eth_account.messages import encode_defunct
from eth_account import Account

from datetime import datetime, timedelta
import secrets
from jose import JWTError, jwt

from app.schemas.auth import MeResponse
from app.core.config import settings
from app.db.session import get_session


router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer()

NONCE_STORE = {}

class NonceRequest(BaseModel):
    alamat_wallet: str

class SiweVerifyRequest(BaseModel):
    message: str
    signature: str


@router.post("/nonce")
async def get_nonce(req: NonceRequest):
    nonce = secrets.token_hex(8)
    NONCE_STORE[req.alamat_wallet.lower()] = nonce
    return {"nonce": nonce}


@router.post("/siwe")
async def verify_siwe(req: SiweVerifyRequest, session: AsyncSession = Depends(get_session)):
    """
    Verifikasi SIWE, pastikan pengguna ada di tabel `pengguna`,
    lalu buat JWT dengan sub = id pengguna (UUID) dan wallet = alamat wallet.
    """
    try:
        # --- parse pesan untuk SIWE ---
        lines = [line.strip() for line in req.message.splitlines() if line.strip()]
        address_line = [l for l in lines if l.startswith("0x") or l.startswith("0X")]
        if not address_line:
            raise ValueError("Alamat wallet tidak ditemukan dalam pesan")
        wallet = address_line[0].lower()

        nonce_line = [l for l in lines if l.lower().startswith("nonce:")]
        if not nonce_line:
            raise ValueError("Nonce tidak ditemukan dalam pesan")
        nonce = nonce_line[0].split(":", 1)[1].strip()

        # --- cek nonce ---
        if NONCE_STORE.get(wallet) != nonce:
            raise HTTPException(status_code=400, detail="Nonce tidak valid atau sudah kedaluwarsa")

        # --- verifikasi signature ---
        msg = encode_defunct(text=req.message)
        recovered = Account.recover_message(msg, signature=req.signature)
        if recovered.lower() != wallet:
            raise HTTPException(status_code=401, detail="Signature tidak cocok dengan wallet")

        # --- upsert ke tabel `pengguna` ---
        # cek pengguna berdasarkan alamat_wallet
        q_select = text("""
            SELECT id, peran
            FROM pengguna
            WHERE lower(alamat_wallet) = :w
            LIMIT 1
        """)
        row = (await session.execute(q_select, {"w": wallet})).mappings().first()

        if row:
            user_id = row["id"]
            peran = row["peran"]
        else:
            # buat pengguna baru dengan peran default 'pencipta'
            q_insert = text("""
                INSERT INTO pengguna (alamat_wallet)
                VALUES (:w)
                RETURNING id, peran
            """)
            new_row = (await session.execute(q_insert, {"w": wallet})).mappings().one()
            await session.commit()
            user_id = new_row["id"]
            peran = new_row["peran"]

        # --- buat JWT: sub = id pengguna (UUID), wallet = alamat wallet ---
        now = datetime.utcnow()
        payload = {
            "iss": settings.JWT_ISS,
            "aud": settings.JWT_AUD,
            "sub": str(user_id),      
            "wallet": wallet,
            "peran": peran,
            "iat": now,
            "exp": now + timedelta(minutes=int(settings.JWT_EXPIRE_MIN)),
        }

        token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

        # nonce sekali pakai: hapus
        NONCE_STORE.pop(wallet, None)

        return {"access_token": token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SIWE gagal: {e}")
    


@router.get("/me", response_model=MeResponse)
async def get_me(
    creds: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
):
    """
    Balikin profil user saat ini berdasarkan JWT yang dikirim di Authorization: Bearer <token>.
    """
    token = creds.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            audience=settings.JWT_AUD,
            issuer=settings.JWT_ISS,
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token tidak valid: {e}")

    user_id = payload.get("sub")
    wallet = (payload.get("wallet") or "").lower()
    peran = payload.get("peran")


    if not user_id:
        raise HTTPException(status_code=401, detail="Token tidak punya sub (user_id)")

    # ---- OPSIONAL: ambil nama dari DB kalau ada kolomnya ----
    # ganti 'nama' dengan nama kolom sebenarnya di tabel `pengguna`
    # rs = await session.execute(
    #     text("SELECT nama FROM pengguna WHERE id = :uid"),
    #     {"uid": user_id},
    # )
    # row = rs.mappings().first()
    # name = row["nama"] if row else None

    return MeResponse(
        id=str(user_id),
        wallet_address=wallet,
        name=None,
        peran = payload.get("peran")
    )


async def get_admin_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
):
    """Autentikasi + cek peran verifikator/admin."""
    token = creds.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            audience=settings.JWT_AUD,
            issuer=settings.JWT_ISS,
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token tidak valid: {e}")

    user_id = payload.get("sub")
    wallet = (payload.get("wallet") or "").lower()
    peran = payload.get("peran")  # <-- PAKE "peran", BUKAN "peran"

    if not user_id:
        raise HTTPException(status_code=401, detail="Token tidak punya sub (user_id)")

    # kalau peran di token kosong, cek DB
    if peran is None:
        rs = await session.execute(
            text("SELECT peran FROM pengguna WHERE id = :uid"),
            {"uid": user_id},
        )
        peran = rs.scalar_one_or_none()

    if peran not in ("verifikator", "admin"):
        raise HTTPException(
            status_code=403,
            detail=f"Hanya verifikator / admin (peran sekarang: {peran!r})",
        )

    return {
        "user_id": user_id,
        "wallet": wallet,
        "peran": peran,
    }