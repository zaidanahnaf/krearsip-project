import type { WorkStatus, OnchainStatus } from "../../../api/types";

// ------- Badge helpers -------
export function getStatusBadgeLabel(status: WorkStatus): string {
    switch (status) {
        case 'draft':
            return 'Draft';
        case 'terverifikasi':
            return 'Terverifikasi';
        case 'on_chain':
            return 'On-chain';
        default:
            return status;
    }
}

export function getStatusBadgeClass(status: WorkStatus): string {
    switch (status) {
        case 'draft':
            return 'bg-yellow-100 text-yellow-800';
        case 'terverifikasi':
            return 'bg-blue-100 text-blue-800';
        case 'on_chain':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export function getOnchainBadgeLabel(onchain: OnchainStatus): string {
    switch (onchain) {
        case 'tidak ada':
            return 'Belum dikirim';
        case 'dalam antrian':
            return 'Dalam antrian worker';
        case 'menunggu':
            return 'Tx dikirim, menunggu';
        case 'berhasil':
            return 'Tx berhasil';
        case 'gagal':
            return 'Tx gagal';
        default:
            return onchain;
    }
}

export function getOnchainBadgeClass(onchain: OnchainStatus): string {
    switch (onchain) {
        case 'tidak ada':
            return 'bg-gray-100 text-gray-800';
        case 'dalam antrian':
            return 'bg-indigo-100 text-indigo-800';
        case 'menunggu':
            return 'bg-blue-100 text-blue-800';
        case 'berhasil':
            return 'bg-emerald-100 text-emerald-800';
        case 'gagal':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// ------- Rules untuk tombol (satu sumber kebenaran) -------

export function canApprove(status: WorkStatus, onchain: OnchainStatus): boolean {
    return status === 'draft';
}

export function canReject(status: WorkStatus, _onchain: OnchainStatus): boolean {
    return status === 'draft';
}

export function canDeploy(status: WorkStatus, onchain: OnchainStatus): boolean {
    return (
        status === 'draft' &&
        (onchain === 'menunggu' || onchain === 'gagal')
    );
}

export function canSync(status: WorkStatus, onchain: OnchainStatus): boolean {
    return status === 'on_chain' && onchain === 'menunggu';
}

export function canVerify(status: WorkStatus, onchain: OnchainStatus): boolean {
    return status === 'on_chain' && onchain === 'berhasil'
}