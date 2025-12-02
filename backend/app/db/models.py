from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, JSON, ForeignKey, TIMESTAMP, Enum, BigInteger

class Base(DeclarativeBase): pass

class Pengguna(Base):
    __tablename__ = "pengguna"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    alamat_wallet: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(120))
    nama_tampil: Mapped[str | None] = mapped_column(String(80))
    peran: Mapped[str] = mapped_column(Enum("pencipta","verifikator","admin", name="peran_pengguna"))
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP)
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP)

class Karya(Base):
    __tablename__ = "karya"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    id_pengguna: Mapped[str] = mapped_column(String, ForeignKey("pengguna.id", ondelete="CASCADE"))
    judul: Mapped[str] = mapped_column(String(150))
    hash_berkas: Mapped[str] = mapped_column(String(64))
    cid_ipfs: Mapped[str | None] = mapped_column(String(255))
    tx_hash: Mapped[str | None] = mapped_column(String(100))
    alamat_kontrak: Mapped[str | None] = mapped_column(String(100))
    jaringan_ket: Mapped[str | None] = mapped_column(String(40))
    waktu_blok: Mapped[str | None] = mapped_column(TIMESTAMP)
    status: Mapped[str] = mapped_column(Enum("draft","on_chain","terverifikasi", name="status_karya"))
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP)
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP)

class CatatanAudit(Base):
    __tablename__ = "catatan_audit"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_pengguna: Mapped[str | None] = mapped_column(String, ForeignKey("pengguna.id", ondelete="SET NULL"))
    aksi: Mapped[str] = mapped_column(String(100))
    muatan: Mapped[dict | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String)
    user_agent: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP)

class AuthNonce(Base):
    __tablename__ = "auth_nonce"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    alamat_wallet: Mapped[str] = mapped_column(String(64))
    nonce: Mapped[str] = mapped_column(String(32))
    expired_at: Mapped[str] = mapped_column(TIMESTAMP)
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP)
