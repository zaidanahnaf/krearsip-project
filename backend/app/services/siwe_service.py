import secrets, re
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import make_jwt
from app.repositories.nonce_repository import NonceRepository
from app.repositories.user_repository import UserRepository
from app.utils.siwe import parse_siwe_message, recover_address, ADDR_RE

class SIWEService:
    @staticmethod
    async def issue_nonce(session: AsyncSession, wallet: str) -> str:
        if not ADDR_RE.match(wallet): raise ValueError("Alamat wallet tidak valid")
        nonce = secrets.token_urlsafe(16)[:16]
        await NonceRepository.create(session, wallet.lower(), nonce)
        await session.commit()
        return nonce

    @staticmethod
    async def verify(session: AsyncSession, wallet: str, message: str, signature: str) -> str:
        if not ADDR_RE.match(wallet): raise ValueError("Alamat wallet tidak valid")
        m = parse_siwe_message(message)
        if m["domain"] != settings.SIWE_DOMAIN: raise ValueError("Domain SIWE tidak cocok")
        if m["uri"] != settings.SIWE_URI: raise ValueError("URI SIWE tidak cocok")
        if str(m["version"]) != "1": raise ValueError("Versi SIWE harus 1")
        if int(m["chainId"]) != settings.CHAIN_ID: raise ValueError("Chain ID tidak cocok")
        if m["address"].lower() != wallet.lower(): raise ValueError("Alamat pada SIWE tidak cocok")

        rec = await NonceRepository.get_valid(session, wallet.lower())
        if not rec: raise ValueError("Nonce tidak ditemukan/kedaluwarsa")
        if rec["nonce"] != m["nonce"]: raise ValueError("Nonce tidak cocok")

        recovered = recover_address(message, signature).lower()
        if recovered != wallet.lower(): raise ValueError("Signature tidak cocok")

        await NonceRepository.delete_by_id(session, rec["id"])

        user = await UserRepository.upsert_by_wallet(session, wallet.lower())
        await session.commit()

        token = make_jwt(sub=str(user["id"]), wallet=user["alamat_wallet"])
        return token
