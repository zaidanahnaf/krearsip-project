import re
from eth_account.messages import encode_defunct
from eth_account import Account
from web3 import Web3

ADDR_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")

def parse_siwe_message(msg: str) -> dict:
    lines = [l.strip() for l in msg.split("\n") if l.strip()]
    if len(lines) < 2:
        raise ValueError("Format SIWE tidak valid")
    domain = lines[0].split(" ")[0]
    address = lines[1]
    fields = {}
    for l in lines:
        if l.startswith("URI: "): fields["uri"] = l[5:].strip()
        elif l.startswith("Version: "): fields["version"] = l[9:].strip()
        elif l.startswith("Chain ID: "): fields["chainId"] = int(l[10:].strip())
        elif l.startswith("Nonce: "): fields["nonce"] = l[7:].strip()
        elif l.startswith("Issued At: "): fields["issuedAt"] = l[11:].strip()
    return {
        "domain": domain, "address": address, "uri": fields.get("uri"),
        "version": fields.get("version"), "chainId": fields.get("chainId"),
        "nonce": fields.get("nonce"), "issuedAt": fields.get("issuedAt"),
    }

def recover_address(message: str, signature: str) -> str:
    eth_message = encode_defunct(text=message)
    rec = Account.recover_message(eth_message, signature=signature)
    return Web3.to_checksum_address(rec)
