from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.work_repository import WorkRepository

class WorkService:
    @staticmethod
    async def create_draft(session: AsyncSession, user_id: str, judul: str, hash_berkas: str):
        """
        Buat draft karya baru milik pengguna tertentu.
        `user_id` = UUID dari tabel `pengguna` (bukan alamat wallet).
        """
        q = text("""
            INSERT INTO karya (pengguna_id, judul, hash_berkas, status)
            VALUES (:uid, :judul, :hash_berkas, 'draft')
            RETURNING id, judul, hash_berkas, status, created_at
        """)
        row = (await session.execute(q, {
            "uid": user_id,
            "judul": judul,
            "hash_berkas": hash_berkas,
        })).mappings().one()
        await session.commit()
        return row
    
    @staticmethod
    async def update_on_chain(session, pengguna_id, karya_id, tx_hash, alamat_kontrak, jaringan_ket, waktu_blok_iso):
        wb = waktu_blok_iso or None
        row = await WorkRepository.update_on_chain(
            session, karya_id, pengguna_id, tx_hash, alamat_kontrak, jaringan_ket, wb
        )
        await session.commit()
        return row
    
    @staticmethod
    async def verify(session: AsyncSession, verifier_user_id: str, karya_id: str):
        q_peran = text("SELECT peran FROM pengguna WHERE id = :uid LIMIT 1")
        peran = (await session.execute(q_peran, {"uid": verifier_user_id})).scalar_one_or_none()
        if peran != "verifikator" and peran != "admin":
            raise PermissionError("Hanya verifikator/admin yang bisa memverifikasi")

        q = text("""
          UPDATE karya
          SET status = 'terverifikasi',
              updated_at = NOW()
          WHERE id = :kid
          RETURNING id, judul, status, tx_hash, alamat_kontrak, jaringan_ket, waktu_blok, updated_at
        """)
        row = (await session.execute(q, {"kid": karya_id})).mappings().first()
        if row:
            await session.execute(
                text("""INSERT INTO catatan_audit(pengguna_id, aksi, muatan)
                        VALUES (:uid, 'VERIFIKASI', jsonb_build_object('karya_id', :kid))"""),
                {"uid": verifier_user_id, "kid": karya_id},
            )
            await session.commit()
        return row
