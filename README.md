Krearsip V2 — Hybrid On-Chain/Off-Chain Proof-of-Creation System

Krearsip V2 adalah platform verifikasi dan registrasi karya digital yang menggabungkan teknologi blockchain (Ethereum) dengan database off-chain untuk menciptakan bukti kepemilikan yang aman, permanen, dan terverifikasi.
Sistem ini dikembangkan menggunakan React (Frontend), FastAPI (Backend), dan Solidity + Hardhat (Smart Contract).

🚀 Tech Stack
- Frontend

- React 19

- Vite 7

- TailwindCSS

- React Router v7

- Framer Motion

- Lucide Icons

- Backend

- FastAPI

- SQLAlchemy 2.0

- PostgreSQL (Supabase)

- Pydantic v2

- Psycopg2 + AsyncPG

- Web3.py (Blockchain Integration)

- Blockchain

Solidity ^0.8.19

Hardhat 3

Ethers.js v6

Sepolia Testnet

📌 Main Features

Upload & Hashing (SHA-256): file tidak disimpan on-chain, hanya fingerprint-nya.

Hybrid Storage: metadata disimpan di PostgreSQL (Supabase), hash dicatat di blockchain.

Smart Contract Registry: pencatatan permanen menggunakan event logs.

Admin Dashboard: manajemen karya dan sinkronisasi transaksi.

SIWE-like Authentication: login berbasis wallet signature (experiment).

Blockchain Transaction Sync: backend mengirim transaksi via Hardhat helper script.

📂 Project Structure
krearsip-v2/
│
├── frontend/        → React UI (Vite + Tailwind)
│
├── backend/         → FastAPI REST API + DB + Blockchain handler
│   ├── app/
│   ├── core/
│   ├── routes/
│   ├── schemas/
│   └── services/
│
├── blockchain/      → Solidity smart contract + Hardhat scripts
│   ├── contracts/
│   ├── scripts/
│   ├── artifacts/   (ignored by git)
│   └── hardhat.config.js
│
├── docs/
│   ├── erd.png
│   ├── schema.sql
│   └── system-architecture.png
│
├── .gitignore
└── README.md

⚙️ Setup Instructions
1. Clone Repository
git clone https://github.com/<username>/krearsip-v2.git
cd krearsip-v2

2. Backend Setup (FastAPI)
cd backend
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt

Jalankan Backend:
uvicorn app.main:app --reload

Backend ENV:

Buat file .env:

DATABASE_URL=postgresql://...
RPC_URL=https://sepolia.infura.io/v3/...
PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
JWT_SECRET=...

3. Frontend Setup (React + Vite)
cd frontend
npm install
npm run dev

Frontend ENV:
VITE_API_URL=http://localhost:8000

4. Blockchain Setup (Hardhat)
cd blockchain
npm install
npx hardhat compile

Deploy ke Sepolia:
npm run deploy:sepolia

Register karya secara manual (testing):
npm run register:sepolia

Blockchain ENV (.env):
PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://...

🧠 How Krearsip Works (High-Level)

User meng-upload karya → backend menghasilkan SHA-256 hash

Hash + metadata disimpan di PostgreSQL (off-chain)

Admin melakukan verifikasi → backend memanggil Hardhat script

Smart contract menerima hash → mencatat event WorkRegistered

Explorer menampilkan transaction logs sebagai bukti immutable

Hash tersebut dapat diverifikasi kapan saja → file sama = hash sama

🔒 Smart Contract Overview
function registerWork(
    bytes32 fileHash,
    address creator,
    string calldata title
) external onlyOwner {
    require(works[fileHash].creator == address(0), "sudah terdaftar");

    works[fileHash] = WorkInfo(
        creator,
        msg.sender,
        block.timestamp,
        title
    );

    emit WorkRegistered(
        fileHash,
        creator,
        msg.sender,
        title,
        block.timestamp
    );
}


Menggunakan event log (lebih murah daripada storage penuh)

Menggunakan onlyOwner untuk mencegah abuse

Menyimpan metadata on-chain hanya sebagai log, bukan storage

🗄️ Database Schema

Schema lengkap ada di folder docs/schema.sql.

📜 License

MIT License — bebas digunakan, dimodifikasi, dan dikembangkan.

⭐ Credit

Project by Dhafa Zaidan Ahnaf
For Framework Pemrograman Web — Universitas Singaperbangsa Karawang
2025