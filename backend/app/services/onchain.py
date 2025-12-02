# app/services/onchain.py
from __future__ import annotations

from typing import Dict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from web3 import Web3
from eth_account import Account

from app.eth.krearsip_v2 import get_krearsip_contract
from app.core.config import settings

# -------- Web3 + account setup --------

SEPOLIA_RPC = settings.SEPOLIA_RPC
REGISTRAR_PRIVATE_KEY = settings.REGISTRAR_PRIVATE_KEY
CHAIN_ID = int(getattr(settings, "ETH_CHAIN_ID", 11155111))

w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC))

# HATI-HATI: hanya dipanggil sekali di startup
Account.enable_unaudited_hdwallet_features()
registrar_account = Account.from_key(REGISTRAR_PRIVATE_KEY)

contract = get_krearsip_contract()


def send_register_tx(file_hash_hex: str, title: str, creator_address: str) -> str:
    """
    Kirim tx registerWork(fileHash, creator, title) ke KrearsipV2.
    - file_hash_hex: sha256 hex string (64 char), boleh dengan / tanpa '0x'
    - creator_address: alamat wallet kreator (0x....40 char)
    """

    # --- normalisasi & validasi hash ---
    if not file_hash_hex:
        raise ValueError("hash_berkas kosong")

    h = file_hash_hex.strip().lower()
    if h.startswith("0x"):
        h = h[2:]

    if len(h) != 64:
        raise ValueError("hash_berkas harus 64 karakter hex (sha256)")

    # pastikan semua char hex
    try:
        bytes.fromhex(h)
    except ValueError:
        # ini yang sebelumnya kamu lihat: "Non-hexadecimal digit found"
        raise ValueError("hash_berkas mengandung karakter non-hex")

    # jadikan bytes32
    file_hash_bytes32 = Web3.to_bytes(hexstr="0x" + h)

    # --- normalisasi & validasi alamat creator ---
    if not creator_address:
        raise ValueError("alamat_wallet kreator kosong")

    addr = creator_address.strip()
    if not Web3.is_address(addr):
        raise ValueError(f"alamat_wallet kreator tidak valid: {addr}")

    creator_checksum = Web3.to_checksum_address(addr)

    # --- build & sign tx ---
    nonce = w3.eth.get_transaction_count(registrar_account.address)

    tx = contract.functions.registerWork(
        file_hash_bytes32,
        creator_checksum,
        title,
    ).build_transaction(
        {
            "from": registrar_account.address,
            "nonce": nonce,
            "chainId": CHAIN_ID,
            "gas": 200_000,
            "maxFeePerGas": w3.to_wei("30", "gwei"),
            "maxPriorityFeePerGas": w3.to_wei("1", "gwei"),
        }
    )

    signed = registrar_account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    return tx_hash.hex()


async def send_register_tx_for_karya(karya_id: UUID, session: AsyncSession) -> str:
    """
    Wrapper level DB:
    - ambil data karya + wallet kreator
    - validasi status (hanya draft + status_onchain='menunggu')
    - panggil send_register_tx()
    - simpan tx_hash & status_onchain='menunggu'
    """
    rs = await session.execute(
        text(
            """
            SELECT 
                k.id,
                k.judul,
                k.hash_berkas,
                k.status,
                k.status_onchain,
                p.alamat_wallet
            FROM karya k
            JOIN pengguna p ON p.id = k.pengguna_id
            WHERE k.id = :kid
            """
        ),
        {"kid": str(karya_id)},
    )
    row = rs.mappings().first()
    if not row:
        raise ValueError("Karya tidak ditemukan")

    # hanya boleh deploy kalau masih draft & onchain 'menunggu'
    if not (row["status"] == "draft" and row["status_onchain"] == "menunggu"):
        raise ValueError(
            f"Karya tidak dalam antrian deploy (status={row['status']}, "
            f"status_onchain={row['status_onchain']})"
        )

    file_hash_hex = row["hash_berkas"]
    title = row["judul"]
    creator_wallet = row["alamat_wallet"]

    tx_hash = send_register_tx(file_hash_hex, title, creator_wallet)

    # simpan tx_hash dan tetap status_onchain='menunggu'
    await session.execute(
        text(
            """
            UPDATE karya
            SET 
                tx_hash = :tx_hash,
                status = 'on_chain',
                status_onchain = 'menunggu',
                updated_at = NOW()
            WHERE id = :kid
            """
        ),
        {"kid": str(karya_id), "tx_hash": tx_hash},
    )
    await session.commit()

    return tx_hash


async def sync_tx_for_karya(karya_id: UUID, session: AsyncSession) -> Dict:
    """
    Tarik receipt tx_hash dari chain, update status_onchain + status + alamat_kontrak.
    """
    # Ambil data karya dulu
    rs = await session.execute(
        text(
            """
            SELECT id, tx_hash, status, status_onchain, alamat_kontrak
            FROM karya
            WHERE id = :kid
            """
        ),
        {"kid": karya_id},
    )
    row = rs.mappings().first()
    if not row:
        raise ValueError("Karya tidak ditemukan")

    tx_hash = row["tx_hash"]
    if not tx_hash:
        raise ValueError("Karya belum punya tx_hash untuk di-sync")

    # Ambil receipt di chain
    receipt = w3.eth.get_transaction_receipt(tx_hash)
    new_onchain_status = "berhasil" if receipt["status"] == 1 else "gagal"

    # Tentukan status karya baru: kalau tx berhasil -> on_chain
    current_status: str = row["status"]
    # new_status = "on_chain" if new_onchain_status == "berhasil" else current_status

    # Ambil info blok
    block_number = receipt["blockNumber"]
    block = w3.eth.get_block(block_number)
    block_ts = block["timestamp"]

    # Alamat kontrak: pakai alamat kontrak Krearsip V2 kalau berhasil, kalau tidak pakai nilai lama
    old_kontrak = row["alamat_kontrak"]
    new_kontrak = contract.address if new_onchain_status == "berhasil" else old_kontrak

    rs2 = await session.execute(
        text(
            """
            UPDATE karya
            SET status_onchain = :status_onchain,
                status        = :status,
                alamat_kontrak = :alamat_kontrak,
                block_number  = :block_number,
                waktu_blok    = to_timestamp(:block_ts),
                updated_at    = NOW()
            WHERE id = :kid
            RETURNING id, judul, status, status_onchain,
                      alamat_kontrak, block_number, waktu_blok, tx_hash
            """
        ),
        {
            "kid": karya_id,
            "status_onchain": new_onchain_status,
            "status": current_status,
            "alamat_kontrak": new_kontrak,
            "block_number": block_number,
            "block_ts": block_ts,
        },
    )
    data = rs2.mappings().first()
    await session.commit()

    return dict(data)