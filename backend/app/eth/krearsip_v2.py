# app/eth/krearsip_v2.py
from pathlib import Path
import json
from web3 import Web3
from app.core.config import settings

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend/app
ARTIFACT_PATH = BASE_DIR / "eth_artifacts" / "KrearsipV2.json"

with ARTIFACT_PATH.open() as f:
    artifact = json.load(f)

KREARSIP_V2_ABI = artifact["abi"]

KREARSIP_V2_ADDRESS = settings.KREARSIP_V2_ADDRESS  # dari env

w3 = Web3(Web3.HTTPProvider(settings.SEPOLIA_RPC))

def get_krearsip_contract():
    return w3.eth.contract(
        address=Web3.to_checksum_address(KREARSIP_V2_ADDRESS),
        abi=KREARSIP_V2_ABI,
    )
