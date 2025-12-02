# app/api/admin_works.py

from typing import Optional, Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_session as get_db
from backend.app.services.admin_auth import require_admin, AdminUser
from app.schemas.admin_works import (
    AdminWorkListResponse,
    AdminWorkListItem,
    AdminWorkDetail,
    ApproveWorkRequest,
    RejectWorkRequest,
    PublishOnchainRequest,
    WorkActionResponse,
)
from app.services import works_admin_service


router = APIRouter(prefix="/admin/works", tags=["Admin - Works"])


@router.get("", response_model=AdminWorkListResponse)
async def list_admin_works(
    status: Optional[str] = Query(None, description="Filter by work status"),
    status_onchain: Optional[str] = Query(None, description="Filter by on-chain status"),
    search: Optional[str] = Query(None, description="Search in title or hash"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_admin),
):
    """
    List all works with admin-level detail and filtering.
    Requires admin authentication.
    """
    works, total = works_admin_service.list_admin_works(
        db=db,
        status_filter=status,
        status_onchain_filter=status_onchain,
        search=search,
        limit=limit,
        offset=offset,
    )
    
    # Convert to response schema
    items = [
        AdminWorkListItem(
            id=w.id,
            judul=w.judul,
            status=w.status,
            tx_hash=w.tx_hash,
            jaringan_ket=w.jaringan_ket,
            etherscan_url=w.etherscan_url,
            updated_at=w.updated_at,
            hash_berkas=w.hash_berkas,
            creator_id=w.creator_id,
            verified_at=w.verified_at,
            verified_by=w.verified_by,
            alasan_penolakan=w.alasan_penolakan,
            status_onchain=w.status_onchain,
            alamat_wallet=w.alamat_wallet,
            creator_nama=w.creator.nama if w.creator else None,
            verifier_nama=w.verifier.nama if w.verifier else None,
        )
        for w in works
    ]
    
    return AdminWorkListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{work_id}", response_model=AdminWorkDetail)
async def get_admin_work_detail(
    work_id: UUID,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_admin),
):
    """
    Get full detail of a specific work including all admin fields.
    Requires admin authentication.
    """
    work = works_admin_service.get_admin_work_detail(work_id, db)
    
    # Convert to response schema with embedded relations
    from app.schemas.admin_works import CreatorInfo, VerifierInfo
    
    return AdminWorkDetail(
        id=work.id,
        judul=work.judul,
        status=work.status,
        tx_hash=work.tx_hash,
        jaringan_ket=work.jaringan_ket,
        etherscan_url=work.etherscan_url,
        updated_at=work.updated_at,
        hash_berkas=work.hash_berkas,
        creator_id=work.creator_id,
        verified_at=work.verified_at,
        verified_by=work.verified_by,
        alasan_penolakan=work.alasan_penolakan,
        status_onchain=work.status_onchain,
        alamat_wallet=work.alamat_wallet,
        block_number=work.block_number,
        onchain_timestamp=work.onchain_timestamp,
        creator=CreatorInfo(
            id=work.creator.id,
            nama=work.creator.nama,
            email=work.creator.email,
            wallet_address=getattr(work.creator, 'wallet_address', None),
        ) if work.creator else None,
        verifier=VerifierInfo(
            id=work.verifier.id,
            nama=work.verifier.nama,
            email=work.verifier.email,
        ) if work.verifier else None,
    )


@router.post("/{work_id}/approve", response_model=WorkActionResponse)
async def approve_work(
    work_id: UUID,
    request: ApproveWorkRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_admin),
):
    """
    Approve a draft work, moving it to 'terkonfirmasi' status.
    Queues work for blockchain publishing.
    Requires admin authentication.
    """
    work = works_admin_service.approve_work(
        work_id=work_id,
        verifier_id=admin.user_id,
        db=db,
        notes=request.notes,
    )
    
    # Convert to detail response
    detail = await get_admin_work_detail(work_id, db, admin)
    
    return WorkActionResponse(
        success=True,
        message=f"Work '{work.judul}' approved and queued for blockchain publishing",
        work=detail,
    )


@router.post("/{work_id}/reject", response_model=WorkActionResponse)
async def reject_work(
    work_id: UUID,
    request: RejectWorkRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_admin),
):
    """
    Reject a work with a reason.
    Can reject draft or confirmed (not yet verified) works.
    Requires admin authentication.
    """
    work = works_admin_service.reject_work(
        work_id=work_id,
        alasan_penolakan=request.alasan_penolakan,
        db=db,
        allow_resubmission=request.allow_resubmission,
    )
    
    # Convert to detail response
    detail = await get_admin_work_detail(work_id, db, admin)
    
    return WorkActionResponse(
        success=True,
        message=f"Work '{work.judul}' rejected. Reason: {request.alasan_penolakan}",
        work=detail,
    )


@router.post("/{work_id}/publish-onchain", response_model=WorkActionResponse)
async def publish_work_onchain(
    work_id: UUID,
    request: PublishOnchainRequest = PublishOnchainRequest(),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_admin),
):
    """
    Publish an approved work to the blockchain.
    Only works with status='terkonfirmasi' can be published.
    Requires admin authentication.
    """
    work = works_admin_service.publish_work_onchain(
        work_id=work_id,
        db=db,
        target_network=request.target_network,
    )
    
    # Convert to detail response
    detail = await get_admin_work_detail(work_id, db, admin)
    
    return WorkActionResponse(
        success=True,
        message=f"Work '{work.judul}' successfully published on-chain",
        work=detail,
    )