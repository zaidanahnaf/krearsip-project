# app/services/works_admin_service.py

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.work import Work  # Your SQLAlchemy model
from app.models.user import User  # Your user model


def list_admin_works(
    db: Session,
    status_filter: Optional[str] = None,
    status_onchain_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Work], int]:
    """
    List works with admin filters and pagination.
    Returns (works_list, total_count).
    """
    query = select(Work).options(
        joinedload(Work.creator),
        joinedload(Work.verifier)
    )
    
    # Apply filters
    filters = []
    if status_filter:
        filters.append(Work.status == status_filter)
    if status_onchain_filter:
        filters.append(Work.status_onchain == status_onchain_filter)
    if search:
        search_pattern = f"%{search}%"
        filters.append(
            or_(
                Work.judul.ilike(search_pattern),
                Work.hash_berkas.ilike(search_pattern)
            )
        )
    
    if filters:
        query = query.where(and_(*filters))
    
    # Get total count
    count_query = select(func.count()).select_from(Work)
    if filters:
        count_query = count_query.where(and_(*filters))
    total = db.execute(count_query).scalar_one()
    
    # Apply pagination and ordering
    query = query.order_by(Work.updated_at.desc()).limit(limit).offset(offset)
    works = db.execute(query).scalars().all()
    
    return list(works), total


def get_admin_work_detail(work_id: UUID, db: Session) -> Work:
    """Get full work detail with all relations loaded."""
    query = select(Work).options(
        joinedload(Work.creator),
        joinedload(Work.verifier)
    ).where(Work.id == work_id)
    
    work = db.execute(query).scalar_one_or_none()
    if not work:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work {work_id} not found"
        )
    return work


def approve_work(
    work_id: UUID,
    verifier_id: str,
    db: Session,
    notes: Optional[str] = None
) -> Work:
    """
    Approve a draft work, setting it to 'terkonfirmasi' status.
    Only works in 'draft' status can be approved.
    """
    work = get_admin_work_detail(work_id, db)
    
    if work.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve work with status '{work.status}'. Must be 'draft'."
        )
    
    # Update work status and verification info
    work.status = "terkonfirmasi"
    work.verified_at = datetime.now(timezone.utc)
    work.verified_by = UUID(verifier_id)
    work.status_onchain = "queued"
    work.alasan_penolakan = None  # Clear any previous rejection
    work.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(work)
    return work


def reject_work(
    work_id: UUID,
    alasan_penolakan: str,
    db: Session,
    allow_resubmission: bool = True
) -> Work:
    """
    Reject a work with a reason.
    Can reject 'draft' or 'terkonfirmasi' works (not 'terverifikasi').
    """
    work = get_admin_work_detail(work_id, db)
    
    if work.status == "terverifikasi":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject already verified work"
        )
    
    # Set rejection reason and reset to draft for resubmission
    work.alasan_penolakan = alasan_penolakan
    if allow_resubmission:
        work.status = "draft"
        work.status_onchain = "none"
    work.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(work)
    return work


def publish_work_onchain(
    work_id: UUID,
    db: Session,
    target_network: Optional[str] = None
) -> Work:
    """
    Publish work to blockchain.
    Only works with status='terkonfirmasi' and status_onchain in
    ('none', 'queued', 'failed') can be published.
    
    Current implementation: stub/simulation.
    """
    work = get_admin_work_detail(work_id, db)
    
    # Validation
    if work.status != "terkonfirmasi":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot publish work with status '{work.status}'. Must be 'terkonfirmasi'."
        )
    
    if work.status_onchain not in ("none", "queued", "failed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot publish work with status_onchain '{work.status_onchain}'"
        )
    
    # Simulate blockchain publishing (replace with actual implementation)
    result = _simulate_blockchain_publish(work, target_network or "polygon")
    
    # Update work with blockchain info
    work.status = "terverifikasi"
    work.status_onchain = "success"
    work.tx_hash = result["tx_hash"]
    work.alamat_wallet = result["alamat_wallet"]
    work.jaringan_ket = result["network"]
    work.etherscan_url = result["explorer_url"]
    work.block_number = result["block_number"]
    work.onchain_timestamp = result["timestamp"]
    work.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(work)
    return work


def _simulate_blockchain_publish(work: Work, network: str) -> dict:
    """Simulate blockchain publishing. Replace with actual implementation."""
    import secrets
    
    tx_hash = f"0x{secrets.token_hex(32)}"
    contract_addr = f"0x{secrets.token_hex(20)}"
    block_num = secrets.randbelow(10000000) + 40000000
    
    explorer_base = {
        "polygon": "https://polygonscan.com",
        "ethereum": "https://etherscan.io",
        "sepolia": "https://sepolia.etherscan.io"
    }.get(network, "https://polygonscan.com")
    
    return {
        "tx_hash": tx_hash,
        "alamat_wallet": contract_addr,
        "jaringan_ket": network,
        "etherscan_url": f"{explorer_base}/tx/{tx_hash}",
        "block_number": block_num,
        "waktu_blok": datetime.now(timezone.utc)
    }