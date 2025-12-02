from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

class WorkRepository:
    @staticmethod
    async def create_draft(session: AsyncSession, id_pengguna: str, judul: str, hash_berkas: str):
        q = text("""
            INSERT INTO karya (id_pengguna, judul, hash_berkas, status)
            VALUES (:uid, :j, :h, 'draft')
            RETURNING id, judul, hash_berkas, status, created_at
        """)
        row = await session.execute(q, {"uid": id_pengguna, "j": judul, "h": hash_berkas})
        return row.mappings().first()

    @staticmethod
    async def update_on_chain(session, karya_id: str, pengguna_id: str,
                              tx_hash: str, alamat_kontrak: str,
                              jaringan_ket: str | None, waktu_blok_iso: str | None):
        q = text("""
            UPDATE karya
            SET tx_hash = lower(:tx),
                alamat_kontrak = lower(:ak),
                jaringan_ket = COALESCE(:net, jaringan_ket),
                waktu_blok = COALESCE(CAST(:wb AS timestamptz), NOW()),
                status = 'on_chain',
                updated_at = NOW()
            WHERE id = :kid AND pengguna_id = :uid
            RETURNING id, judul, tx_hash, alamat_kontrak, jaringan_ket, waktu_blok, status
        """)
        row = await session.execute(q, {
            "kid": karya_id,
            "uid": pengguna_id,
            "tx": tx_hash,
            "ak": alamat_kontrak,
            "net": jaringan_ket,
            "wb": waktu_blok_iso,   # boleh None
        })
        return row.mappings().first()