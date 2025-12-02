from pathlib import Path
import json

from web3 import Web3
from eth_account import Account

from app.core.config import settings

w3 = Web3(Web3.HTTPProvider(settings.SEPOLIA_RPC))

ABI_PATH = Path(__file__).parent / "KrearsipV2.abi.json"
with ABI_PATH.open() as f:
    KREARSIP_ABI = json.load(f)

KREARSIP_CONTRACT = w3.eth.contract(
    address=Web3.to_checksum_address(settings.KREARSIP_V2_ADDRESS),
    abi=KREARSIP_ABI,
)

DEPLOYER = Account.from_key(settings.KREARSIP_DEPLOYER_PRIVATE_KEY)


async def send_register_tx(hash_berkas_hex: str, title: str, creator_address: str) -> str:
    """
    Kirim tx ke KrearsipV2.registerWork(bytes32 fileHash, address creator, string title)
    dan return tx_hash (hex).
    """
    file_hash_bytes32 = Web3.to_bytes(hexstr=hash_berkas_hex)

    # convert creator (0x...) ke checksum address
    creator = Web3.to_checksum_address(creator_address)

    nonce = w3.eth.get_transaction_count(DEPLOYER.address)

    tx = KREARSIP_CONTRACT.functions.registerWork(
        file_hash_bytes32,
        creator,
        title,
    ).build_transaction({
        "from": DEPLOYER.address,
        "nonce": nonce,
        "gas": 300_000,
        "maxFeePerGas": w3.to_wei("2", "gwei"),
        "maxPriorityFeePerGas": w3.to_wei("1", "gwei"),
        "chainId": 11155111,  # Sepolia
    })

    signed = DEPLOYER.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)

    return tx_hash.hex()