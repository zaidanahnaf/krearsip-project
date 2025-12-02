# app/services/blockchain_service.py

from typing import TypedDict, Optional


class RegisterWorkResult(TypedDict):
    tx_hash: str
    status: str
    block_number: Optional[int]


def register_work_onchain(
    *,
    karya_id: str,
    hash_berkas: str,
    creator_wallet: str,
) -> RegisterWorkResult:
    """
    Stub sementara untuk integrasi blockchain.
    Nanti diganti dengan call Web3 ke smart contract.

    Sekarang cuma balikin tx_hash dummy supaya flow backend nggak putus.
    """
    # TODO: ganti dengan integrasi Web3 asli
    fake_tx = f"0xDUMMY_{karya_id}"
    return {
        "tx_hash": fake_tx,
        "status": "pending",
        "block_number": None,
    }
