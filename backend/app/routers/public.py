from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List
from app.db.session import get_session

router = APIRouter(prefix="/public", tags=["public"])

# GET detail public
# @router.get("/works/{karya_id}")
# async def public_get_work(karya_id: str, session: AsyncSession = Depends(get_session)):
#     q = text("""
#       SELECT
#         k.id::text AS id,
#         k.judul,
#         k.hash_berkas,
#         k.status,
#         k.tx_hash,
#         k.alamat_kontrak,
#         k.jaringan_ket,
#         k.block_number,
#         k.waktu_blok,
#         k.updated_at,
#         CASE
#           WHEN k.jaringan_ket='sepolia' AND k.tx_hash ~* '^0x[0-9a-f]{64}$'
#             THEN 'https://sepolia.etherscan.io/tx/' || lower(k.tx_hash)
#           ELSE NULL
#         END AS etherscan_url
#       FROM karya k
#       WHERE k.id = :id
#       LIMIT 1
#     """)
#     row = (await session.execute(q, {"id": karya_id})).mappings().first()
#     if not row:
#         raise HTTPException(status_code=404, detail="Karya tidak ditemukan")
#     return row

@router.get("/works/{karya_id}")
async def public_get_work(karya_id: str, session: AsyncSession = Depends(get_session)):
    q = text("""
        SELECT
          k.id::text        AS id,
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
        WHERE k.id = :id
    """)

    row = (await session.execute(q, {"id": karya_id})).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Karya tidak ditemukan")

    # Tambah aturan: hanya 'terverifikasi' yang boleh diakses publik
    if row["status"] != "terverifikasi":
        raise HTTPException(
            status_code=404,
            detail="Karya belum terverifikasi untuk publik",
        )

    return row


# GET list public (dengan query sederhana)
# @router.get("/works")
# async def public_list_works(
#     session: AsyncSession = Depends(get_session),
#     qstr: str = Query("", alias="q"),
#     limit: int = Query(20, ge=1, le=100),
#     offset: int = Query(0, ge=0),
# ):
#     base_filter = "TRUE"
#     params = {"limit": limit, "offset": offset}
#     if qstr:
#         base_filter = "k.judul ILIKE :q"
#         params["q"] = f"%{qstr}%"

#     # perbaikan: total juga ikut filter block_number
#     q_total = text(f"""
#         SELECT COUNT(*)
#         FROM karya k
#         WHERE {base_filter} AND k.block_number IS NOT NULL
#     """)
#     total = (await session.execute(q_total, params)).scalar_one()

#     #  etherscan_url: pakai CASE yang sama persis dengan yang lulus tes di Supabase
#     q = text(f"""
#         SELECT
#           k.id::text AS id,
#           k.judul,
#           k.status,
#           k.tx_hash,
#           k.jaringan_ket,
#           k.updated_at,
#           CASE
#             WHEN k.jaringan_ket = 'sepolia'
#              AND k.tx_hash ~* '^0x[0-9a-f]{{64}}$'
#               THEN 'https://sepolia.etherscan.io/tx/' || lower(k.tx_hash)
#             ELSE NULL
#           END AS etherscan_url
#         FROM karya k
#         WHERE {base_filter} AND k.block_number IS NOT NULL
#         ORDER BY k.updated_at DESC
#         LIMIT :limit OFFSET :offset
#     """)

#     rs = await session.execute(q, params)
#     items = rs.mappings().all()

#     return {"items": items, "total": total, "limit": limit, "offset": offset}

@router.get("/works")
async def public_list_works(
    session: AsyncSession = Depends(get_session),
    qstr: str = Query("", alias="q"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List karya untuk publik:
    - Hanya karya berstatus 'terverifikasi'
    - Hanya yang sudah punya block_number (sudah benar-benar on-chain & disync)
    - Bisa di-search dengan q (judul, ILIKE)
    """
    base_filter = "TRUE"
    params = {"limit": limit, "offset": offset}

    if qstr:
        base_filter = "k.judul ILIKE :q"
        params["q"] = f"%{qstr}%"

    # Tambahkan filter status & block_number
    filter_clause = f"{base_filter} AND k.status = 'terverifikasi' AND k.block_number IS NOT NULL"

    # Hitung total untuk pagination
    q_total = text(f"SELECT COUNT(*) FROM karya k WHERE {filter_clause}")
    total = (await session.execute(q_total, params)).scalar_one()

    # Ambil data list
    q = text(f"""
        SELECT
            k.id::text AS id,
            k.judul,
            k.status,
            k.tx_hash,
            k.jaringan_ket,
            k.updated_at,
            CASE
              WHEN k.jaringan_ket = 'sepolia'
                   AND k.tx_hash ~* '^0x[0-9a-f]{{64}}$'
              THEN 'https://sepolia.etherscan.io/tx/' || lower(k.tx_hash)
              ELSE NULL
            END AS etherscan_url
        FROM karya k
        WHERE {filter_clause}
        ORDER BY k.updated_at DESC
        LIMIT :limit OFFSET :offset
    """)

    items = (await session.execute(q, params)).mappings().all()

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }