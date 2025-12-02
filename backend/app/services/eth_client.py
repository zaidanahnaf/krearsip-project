from datetime import datetime, timezone

from web3 import Web3
from web3.middleware import geth_poa_middleware

from app.core.settings import settings

# inisialisasi Web3
w3 = Web3(Web3.HTTPProvider(settings.SEPOLIA_RPC))
# Sepolia = chain PoA → aman tambahin ini
w3.middleware_onion.inject(geth_poa_middleware, layer=0)

DEPLOYER_ADDRESS = Web3.to_checksum_address(settings.KREARSIP_DEPLOYER_ADDRESS)

# ABI minimal KrearsipV2 – COPAS dari artifacts Hardhat (array `abi` nya aja)
KREARSIP_V2_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "fileHash",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "registrar",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "WorkRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "fileHash",
          "type": "bytes32"
        }
      ],
      "name": "getWork",
      "outputs": [
        {
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "registrar",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "fileHash",
          "type": "bytes32"
        }
      ],
      "name": "isRegistered",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "fileHash",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        }
      ],
      "name": "registerWork",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    # kalau ada event / view lain boleh ditambah
]

contract = w3.eth.contract(
    address=Web3.to_checksum_address(settings.KREARSIP_V2_ADDRESS),
    abi=KREARSIP_V2_ABI,
)


def send_register_tx(file_hash_hex: str, title: str, creator_address: str) -> str:
    """
    Kirim transaksi registerWork ke KrearsipV2.
    - file_hash_hex: 64 hex chars tanpa '0x' (kolom hash_berkas di DB lo).
    - title: judul karya
    - creator_address: alamat wallet pencipta (dari tabel pengguna)

    Return: tx_hash (string '0x...')
    """
    # normalisasi input
    if file_hash_hex.startswith("0x"):
        file_hash_hex = file_hash_hex[2:]

    file_hash_bytes32 = Web3.to_bytes(hexstr=file_hash_hex)
    creator = Web3.to_checksum_address(creator_address)

    nonce = w3.eth.get_transaction_count(DEPLOYER_ADDRESS)
    gas_price = w3.eth.gas_price

    tx = contract.functions.registerWork(
        file_hash_bytes32,
        title,
        creator,
    ).build_transaction(
        {
            "from": DEPLOYER_ADDRESS,
            "nonce": nonce,
            "gasPrice": gas_price,
        }
    )

    signed = w3.eth.account.sign_transaction(
        tx,
        private_key=settings.KREARSIP_DEPLOYER_PRIVATE_KEY,
    )
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    return tx_hash.hex()


def get_tx_block_info(tx_hash: str) -> tuple[int, datetime]:
    """
    Ambil block_number + waktu blok dari tx_hash.
    Raise exception kalau tx belum mined / tidak ditemukan.
    """
    receipt = w3.eth.get_transaction_receipt(tx_hash)
    block = w3.eth.get_block(receipt.blockNumber)

    ts = block.timestamp  # seconds
    waktu_blok = datetime.fromtimestamp(ts, tz=timezone.utc)

    return receipt.blockNumber, waktu_blok  