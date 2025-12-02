from datetime import datetime
from backend.app.db.models import Base
from sqlalchemy import Integer
from sqlalchemy import Column, String, Text, BigInteger, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
import uuid
import enum


class WorkStatus(str, enum.Enum):
    """Work status enum"""
    draft = "draft"
    terkonfirmasi = "terkonfirmasi"
    terverifikasi = "terverifikasi"


class OnchainStatus(str, enum.Enum):
    """On-chain publishing status"""
    none = "none"
    queued = "queued"
    pending = "pending"
    success = "success"
    failed = "failed"


class Work(Base):  # Base is your declarative base
    """
    Extended Work model with admin and on-chain fields.
    Backward compatible with existing public/creator APIs.
    """
    __tablename__ = "works"
    
    # Existing fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    judul = Column(String(255), nullable=False)
    status = Column(
        SQLEnum(WorkStatus, name="work_status"),
        nullable=False,
        default=WorkStatus.draft
    )
    tx_hash = Column(Text, nullable=True)
    jaringan_ket = Column(Text, nullable=True)
    etherscan_url = Column(Text, nullable=True)
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Additional public fields (add as needed)
    deskripsi = Column(Text, nullable=True)
    tahun_terbit = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    
    # NEW: Admin and backend-only fields
    hash_berkas = Column(Text, nullable=False)
    pengguna_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    verified_at = Column(TIMESTAMP(timezone=True), nullable=True)
    verified_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    alasan_penolakan = Column(Text, nullable=True)
    status_onchain = Column(
        SQLEnum(OnchainStatus, name="status_onchain"),
        nullable=False,
        default=OnchainStatus.none
    )
    alamat_wallet = Column(Text, nullable=True)
    block_number = Column(BigInteger, nullable=True)
    onchain_timestamp = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Relationships
    creator = relationship(
        "User",
        foreign_keys=[pengguna_id],
        backref="created_works"
    )
    verifier = relationship(
        "User",
        foreign_keys=[verified_by],
        backref="verified_works"
    )
    
    def __repr__(self):
        return f"<Work(id={self.id}, judul='{self.judul}', status={self.status})>"