from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

class NonceRepository:
    @staticmethod
    async def create(session: AsyncSession, wallet: str, nonce: str):
        q = text("""
            INSERT INTO auth_nonce (alamat_wallet, nonce, expired_at)
            VALUES (lower(:w), :n, NOW() + INTERVAL '10 minutes')
            RETURNING id
        """)
        row = await session.execute(q, {"w": wallet, "n": nonce})
        return row.mappings().first()

    @staticmethod
    async def get_valid(session: AsyncSession, wallet: str):
        q = text("""
            SELECT id, nonce, expired_at FROM auth_nonce
            WHERE alamat_wallet = lower(:w) AND expired_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        """)
        row = await session.execute(q, {"w": wallet})
        return row.mappings().first()

    @staticmethod
    async def delete_by_id(session: AsyncSession, id_: str):
        q = text("DELETE FROM auth_nonce WHERE id = :id")
        await session.execute(q, {"id": id_})
