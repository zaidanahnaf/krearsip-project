from uuid import UUID
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WorkCreate(BaseModel):
    judul: str
    hash_berkas: str

class WorkOnChainUpdate(BaseModel):
    tx_hash: str
    alamat_kontrak: str
    jaringan_ket: Optional[str] = "sepolia"
    waktu_blok: Optional[datetime] = None  # boleh null / nggak dikirim

# ini schema baru buat GET detail
class WorkPublic(BaseModel):
    id: UUID
    judul: str
    hash_berkas: str
    status: str

    tx_hash: Optional[str] = None
    alamat_kontrak: Optional[str] = None
    jaringan_ket: Optional[str] = None

    block_number: Optional[int] = None
    waktu_blok: Optional[datetime] = None
    updated_at: datetime

    # field turunan
    etherscan_url: Optional[str] = None
    on_chain_badge: Optional[str] = None

    class Config:
        from_attributes = True  # pydantic v2
        # kalau v1:
        # orm_mode = True

class WorkList(BaseModel):
    items: List[WorkPublic]
    total: int
    limit: int
    offset: int