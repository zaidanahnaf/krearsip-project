from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

class UserRepository:
    @staticmethod
    async def upsert_by_wallet(session: AsyncSession, wallet: str):
        q = text("""
            WITH data AS ( SELECT lower(:w) AS w )
            INSERT INTO pengguna (alamat_wallet)
            SELECT w FROM data
            ON CONFLICT (alamat_wallet)
            DO UPDATE SET updated_at = NOW()
            RETURNING id, alamat_wallet, peran
        """)
        row = await session.execute(q, {"w": wallet})
        return row.mappings().first()
