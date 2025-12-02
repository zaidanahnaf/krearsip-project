# app/eth/web3_client.py
from web3 import Web3
from web3.middleware import geth_poa_middleware

from app.core.config import settings

w3 = Web3(Web3.HTTPProvider(settings.SEPOLIA_RPC))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)

def get_w3() -> Web3:
    if not w3.is_connected():
        raise RuntimeError("Web3 not connected to RPC")
    return w3
