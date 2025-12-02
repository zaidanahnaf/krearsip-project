# scripts/test_krearsipv2.py

import os
import json
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3
from web3.middleware import geth_poa_middleware

# 1) Load .env (pastikan SEPOLIA_RPC & KREARSIP_V2_ADDRESS sudah ada)
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)

SEPOLIA_RPC = os.getenv("SEPOLIA_RPC")
KREARSIP_V2_ADDRESS = os.getenv("KREARSIP_V2_ADDRESS")

if not SEPOLIA_RPC or not KREARSIP_V2_ADDRESS:
    raise RuntimeError("SEPOLIA_RPC atau KREARSIP_V2_ADDRESS belum diset di .env backend")

# 2) Init Web3
w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)

print("Connected:", w3.is_connected())
print("Chain ID :", w3.eth.chain_id)

# 3) Load ABI dari artifact Hardhat (yang tadi lo copy)
artifact_path = BASE_DIR / "eth_artifacts" / "KrearsipV2.json"
with artifact_path.open() as f:
    artifact = json.load(f)

abi = artifact["abi"]

contract = w3.eth.contract(
    address=Web3.to_checksum_address(KREARSIP_V2_ADDRESS),
    abi=abi,
)

# 4) Test call owner()
owner = contract.functions.owner().call()
print("Contract owner:", owner)

# 5) Optional: test isRegistered untuk hash sembarang
# misal pakai 64 hex zero
dummy_hash_hex = "0" * 64
dummy_hash_bytes32 = bytes.fromhex(dummy_hash_hex)

registered = contract.functions.isRegistered(dummy_hash_bytes32).call()
print("isRegistered(0x000...0):", registered)
