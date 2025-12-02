import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

ETHERSCAN_API = "https://sepolia.infura.io/v3/898ffde753034c058587295ccd47b683"  # optional; kalau kosong kita pakai RPC kamu sendiri

async def fill_block_info(session: AsyncSession, jaringan: str, tx_hash: str, block_number: int, iso_time: str):
    q = text("""
      UPDATE karya
      SET block_number = :bn,
          waktu_blok = :wb,
          updated_at = NOW()
      WHERE tx_hash = :tx AND jaringan_ket = :net AND (block_number IS NULL OR waktu_blok IS NULL)
    """)
    await session.execute(q, {"bn": block_number, "wb": iso_time, "tx": tx_hash, "net": jaringan})
    await session.commit()
