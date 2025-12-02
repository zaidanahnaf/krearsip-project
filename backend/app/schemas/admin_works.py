from datetime import datetime
from typing import List, Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.enums import StatusKarya, StatusOnchain


# Enums
WorkStatus = Literal["draft", "terkonfirmasi", "terverifikasi"]
OnchainStatus = Literal["tidak ada", "dalam antrian", "menunggu", "berhasil", "gagal"]


# Base Work schemas (matching frontend types)
class Work(BaseModel):
    id: UUID
    judul: str
    status: WorkStatus
    tx_hash: Optional[str] = None
    jaringan_ket: Optional[str] = None
    etherscan_url: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class PublicWorkDetail(Work):
    # Add other public fields as needed
    deskripsi: Optional[str] = None
    tahun_terbit: Optional[int] = None
    # ... other fields from your existing schema


# Admin-specific schemas
class CreatorInfo(BaseModel):
    """Embedded creator information"""
    id: UUID
    nama: Optional[str] = None
    email: Optional[str] = None
    alamat_wallet: Optional[str] = None

    class Config:
        from_attributes = True


class VerifierInfo(BaseModel):
    """Embedded verifier information"""
    id: UUID
    nama: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


class AdminWorkListItem(Work):
    """Extended work information for admin list view"""
    hash_berkas: str
    pengguna_id: UUID
    verified_at: Optional[datetime] = None
    verified_by: Optional[UUID] = None
    alasan_penolakan: Optional[str] = None
    status_onchain: OnchainStatus
    alamat_wallet: Optional[str] = None
    
    # Embedded relations
    nama_kreator: Optional[str] = None
    nama_verifikator: Optional[str] = None


class AdminWorkDetail(PublicWorkDetail):
    """Full work detail with all admin-only fields"""
    hash_berkas: str
    pengguna_id: UUID
    verified_at: Optional[datetime] = None
    verified_by: Optional[UUID] = None
    alasan_penolakan: Optional[str] = None
    status_karya: OnchainStatus
    alamat_wallet: Optional[str] = None
    block_number: Optional[int] = None
    onchain_timestamp: Optional[datetime] = None
    
    # Embedded relations
    creator: Optional[CreatorInfo] = None
    verifier: Optional[VerifierInfo] = None


# class AdminWorkListResponse(BaseModel):
#     """Paginated list response"""
#     items: list[AdminWorkListItem]
#     total: int
#     limit: int
#     offset: int

class AdminWorkCreator(BaseModel):
    id: UUID
    nama_tampil: Optional[str]
    alamat_wallet: str


class AdminWorkVerifier(BaseModel):
    id: UUID
    nama_tampil: Optional[str]


class AdminWorkItem(BaseModel):
    id: UUID
    judul: str

    status: StatusKarya          # draft | on_chain | terverifikasi
    status_onchain: StatusOnchain  # tidak ada | dalam antrian | menunggu | berhasil | gagal

    jaringan_ket: Optional[str]  # sepolia / dsb
    tx_hash: Optional[str]
    block_number: Optional[int]

    created_at: datetime
    updated_at: datetime

    verified_at: Optional[datetime]
    alasan_penolakan: Optional[str]

    creator: AdminWorkCreator
    verifier: Optional[AdminWorkVerifier]


class AdminWorksListResponse(BaseModel):
    items: List[AdminWorkItem]
    total: int
    limit: int
    offset: int


# Request schemas
class ApproveWorkRequest(BaseModel):
    """Request body for approving a work"""
    notes: Optional[str] = Field(None, description="Optional approval notes")
    schedule_publish: bool = Field(True, description="Queue for blockchain publishing")


class RejectWorkRequest(BaseModel):
    """Request body for rejecting a work"""
    alasan_penolakan: str = Field(..., min_length=10, description="Reason for rejection")
    allow_resubmission: bool = Field(True, description="Allow creator to resubmit after fixes")


class PublishOnchainRequest(BaseModel):
    """Request body for publishing work on-chain"""
    target_network: Optional[str] = Field(None, description="Target blockchain network")
    gas_price_gwei: Optional[float] = Field(None, description="Gas price override")


# Response schemas
class WorkActionResponse(BaseModel):
    """Generic response for work actions"""
    success: bool
    message: str
    work: AdminWorkDetail

class RejectBody(BaseModel):
    reason: str | None = None