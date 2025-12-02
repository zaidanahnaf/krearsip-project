# 🌟 Krearsip: Hybrid Proof-of-Creation System

Krearsip V2 adalah **platform verifikasi dan registrasi karya digital** yang inovatif, menggabungkan keunggulan teknologi **blockchain Ethereum** (untuk imutabilitas) dengan efisiensi **database off-chain** (untuk metadata dan skalabilitas). Tujuannya adalah menciptakan bukti kepemilikan yang **aman, permanen, dan terverifikasi** (Proof-of-Creation).

## 💡 Konsep Utama

Sistem ini mengimplementasikan pendekatan hibrida:
* **Off-Chain:** File karya tidak disimpan di blockchain. Hanya **SHA-256 hash (sidik jari digital)** file yang dicatat. Metadata karya disimpan di database relasional berkinerja tinggi.
* **On-Chain:** Hash dan bukti registrasi dicatat secara permanen di **Ethereum Sepolia Testnet** melalui **Smart Contract Registry** menggunakan *event logs*.

---

## 🚀 Tech Stack

Project ini dikembangkan dengan arsitektur **Full-Stack DApp** (Decentralized Application) menggunakan teknologi berikut:

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | **React 19, Vite 7, TailwindCSS, Framer Motion, React Router v7** | Antarmuka pengguna yang modern, cepat, dan responsif. |
| **Backend** | **FastAPI, SQLAlchemy 2.0, PostgreSQL (Supabase), Web3.py** | API REST berkecepatan tinggi, integrasi database, dan handler transaksi blockchain. |
| **Blockchain** | **Solidity ^0.8.19, Hardhat 3, Ethers.js v6, Sepolia Testnet** | Pengembangan, *testing*, dan *deployment* Smart Contract. |

---

## 📌 Main Features

* **Upload & Hashing:** Menggunakan **SHA-256** untuk membuat *fingerprint* unik dari file. Hanya *hash* yang dikirim ke *backend*.
* **Hybrid Storage:** **Metadata** karya (judul, kreator, dll.) disimpan di **PostgreSQL** (via Supabase), sementara **Hash** dicatat di **Ethereum Blockchain**.
* **Smart Contract Registry:** Pencatatan permanen dan imutabel menggunakan **Event Logs** (lebih efisien biaya gas).
* **Admin Dashboard:** Antarmuka untuk manajemen karya dan sinkronisasi status transaksi blockchain.
* **SIWE-like Authentication:** Login eksperimental berbasis penandatanganan pesan (signature) oleh dompet kripto (**Wallet Signature**).
* **Blockchain Transaction Sync:** Backend mengotomatisasi pengiriman transaksi ke *Smart Contract* melalui *helper scripts* **Hardhat**.

---

## 🧠 Cara Kerja Krearsip (High-Level)



1.  **User Upload:** Pengguna meng-upload karya melalui **Frontend**.
2.  **Backend Processing:** Backend menerima file dan:
    * Menghasilkan **SHA-256 hash**.
    * Menyimpan **Hash + Metadata** di **PostgreSQL**.
3.  **Admin Verification:** Admin memverifikasi data dan memicu proses registrasi on-chain.
4.  **On-Chain Registration:** Backend memanggil *Hardhat script* untuk mengirim transaksi ke *Smart Contract*.
5.  **Proof of Creation:** *Smart Contract* mencatat *event* **`WorkRegistered`**. Explorer Blockchain menampilkan *transaction logs* sebagai bukti imutabel.
6.  **Verification:** *Hash* yang tercatat dapat digunakan kapan saja untuk memverifikasi keaslian file (**file sama = hash sama**).

### Contoh Smart Contract - `registerWork`

```solidity
function registerWork(
    bytes32 fileHash,
    address creator,
    string calldata title
) external onlyOwner {
    require(works[fileHash].creator == address(0), "sudah terdaftar");

    // ... (Logika penyimpanan info dasar)

    emit WorkRegistered(
        fileHash,
        creator,
        msg.sender,
        title,
        block.timestamp
    );
}
```

## 📂 Struktur Proyek
```
krearsip-v2/
│
├── frontend/             → React UI (Vite + Tailwind)
├── backend/              → FastAPI REST API + DB + Blockchain handler
│   ├── app/
│   ├── core/
│   ├── routes/
│   ├── schemas/
│   └── services/
│
├── blockchain/           → Solidity smart contract + Hardhat scripts
│   ├── contracts/
│   ├── scripts/
│   ├── artifacts/        (Ignored by Git)
│   └── hardhat.config.js
│
├── docs/                 → Dokumentasi (Diagram Arsitektur, ERD, Schema DB)
│   ├── erd.png
│   ├── schema.sql
│   └── system-architecture.png
│
├── .gitignore
└── README.md
```

## ⚙️ Setup Instructions
1. Clone Repository
```
git clone [https://github.com/](https://github.com/)<username>/krearsip-v2.git
cd krearsip-v2
```

2. cd backend
```
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Environment Variables (backend/.env)
Buat file .env di direktori backend/ dengan informasi berikut:
```
DATABASE_URL=postgresql://...  # Supabase/PostgreSQL connection string
RPC_URL=[https://sepolia.infura.io/v3/](https://sepolia.infura.io/v3/)... # Sepolia RPC URL
PRIVATE_KEY=0x... # Private key wallet untuk mengirim transaksi on-chain
CONTRACT_ADDRESS=0x... # Alamat Smart Contract yang telah di-deploy
JWT_SECRET=... # Secret key untuk otentikasi
```
Jalankan Backend
```
uvicorn app.main:app --reload
```

3. Frontend Setup (React + Vite)
```
cd frontend
npm install
npm run dev
```
Environment Variables (frontend/.env)
Buat file .env di direktori frontend/ (jika berbeda dari default):
```
VITE_API_URL=http://localhost:8000
```

4. Blockchain Setup (Hardhat)
```
cd blockchain
npm install
npx hardhat compile
```
Environment Variables (blockchain/.env)
Buat file .env di direktori blockchain/ untuk deployment:
```
PRIVATE_KEY=0x... # Private key wallet untuk deployment
SEPOLIA_RPC_URL=https://... # Sepolia RPC URL
```
Deployment & Testing
Gunakan script Hardhat untuk berinteraksi dengan Smart Contract:
```
# Deploy Smart Contract ke Sepolia Testnet
npm run deploy:sepolia

# Register karya secara manual untuk testing
npm run register:sepolia
```

## 🗄️ Database & Lisensi
Database Schema
Skema database lengkap (Entity Relationship Diagram dan SQL) tersedia di folder: docs/schema.sql dan docs/erd.png.

## 📜 License
Proyek ini dilisensikan di bawah MIT License. Anda bebas menggunakan, memodifikasi, dan mengembangkan kode ini.

## ⭐ Credit
Project by: Dhafa Zaidan Ahnaf

For: Mata Kuliah Framework Pemrograman Web — Universitas Singaperbangsa Karawang (2025)
