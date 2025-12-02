import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import WorkTable from '@/Components/Admin/WorkTable';

interface Work {
    id: string;
    judul: string;
    status: string;
    tx_hash?: string;
    jaringan_ket?: string;
    block_number?: number;
    updated_at: string;
    alamat_wallet?: string;
    email?: string;
    etherscan_url?: string;
}

interface Props {
    works: Work[];
    total: number;
    filters: {
        q: string;
        status: string;
        limit: number;
        offset: number;
    };
    error?: string;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function OnchainQueuePage({ works, total, filters, error, flash }: Props) {
    const { flash: pageFlash } = usePage().props as { flash: { success?: string; error?: string } };
    const [syncTxHash, setSyncTxHash] = useState('');

    const handlePublish = (workId: string) => {
        if (confirm('Deploy karya ini ke blockchain?')) {
            router.post(route('admin.works.onchain.publish', workId));
        }
    };

    const handleSyncTx = (e: React.FormEvent) => {
        e.preventDefault();
        if (!syncTxHash.trim()) return;

        router.post(route('admin.works.onchain.sync-tx'), {
            tx_hash: syncTxHash.trim(),
        });
        setSyncTxHash('');
    };

    return (
        <AdminLayout>
            <Head title="Antrian Blockchain" />

            <div className="space-y-6">
                <HeaderSection />

                {(pageFlash?.success || pageFlash?.error || error) && (
                    <AlertSection
                        success={pageFlash?.success}
                        error={pageFlash?.error || error}
                    />
                )}

                <SyncTransactionForm
                    txHash={syncTxHash}
                    setTxHash={setSyncTxHash}
                    onSubmit={handleSyncTx}
                />

                <StatsSection works={works} total={total} />

                <WorkTable
                    works={works}
                    showOwner={true}
                    renderActions={(work) => (
                        <PublishButton work={work} onPublish={handlePublish} />
                    )}
                />

                {works.length > 0 && <PaginationSection filters={filters} total={total} />}
            </div>
        </AdminLayout>
    );
}

function HeaderSection() {
    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900">
                Antrian Blockchain
            </h1>
            <p className="mt-2 text-gray-600">
                Karya yang sudah diapprove dan siap di-deploy ke blockchain
            </p>
        </div>
    );
}

function AlertSection({ success, error }: { success?: string; error?: string }) {
    if (success) {
        return (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                {success}
            </div>
        );
    }
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
            </div>
        );
    }
    return null;
}

function SyncTransactionForm({ txHash, setTxHash, onSubmit }: {
    txHash: string;
    setTxHash: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}) {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Sync Transaction dari Blockchain
            </h3>
            <form onSubmit={onSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 border-blue-300 rounded-md shadow-sm text-sm"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                >
                    Sync
                </button>
            </form>
            <p className="text-xs text-blue-700 mt-2">
                Masukkan transaction hash untuk update status dari blockchain
            </p>
        </div>
    );
}

function StatsSection({ works, total }: { works: Work[]; total: number }) {
    const readyToPublish = works.filter(w => !w.tx_hash).length;
    const inProgress = works.filter(w => w.tx_hash && !w.block_number).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
                label="Total Terkonfirmasi"
                value={total}
                color="blue"
            />
            <StatCard
                label="Siap Deploy"
                value={readyToPublish}
                color="green"
            />
            <StatCard
                label="Sedang Diproses"
                value={inProgress}
                color="yellow"
            />
        </div>
    );
}

function StatCard({ label, value, color }: {
    label: string;
    value: number;
    color: 'blue' | 'green' | 'yellow';
}) {
    const colors = {
        blue: 'bg-blue-50 text-blue-900 border-blue-200',
        green: 'bg-green-50 text-green-900 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    };

    return (
        <div className={`border rounded-lg p-4 ${colors[color]}`}>
            <div className="text-sm font-medium">{label}</div>
            <div className="text-3xl font-bold mt-2">{value}</div>
        </div>
    );
}

function PublishButton({ work, onPublish }: {
    work: Work;
    onPublish: (id: string) => void;
}) {
    if (work.tx_hash) {
        return (
            <span className="text-gray-400 text-xs">
                {work.block_number ? 'On-chain' : 'Processing...'}
            </span>
        );
    }

    return (
        <button
            onClick={() => onPublish(work.id)}
            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
        >
            Deploy
        </button>
    );
}

function PaginationSection({ filters, total }: {
    filters: Props['filters'];
    total: number;
}) {
    const currentPage = Math.floor(filters.offset / filters.limit) + 1;
    const totalPages = Math.ceil(total / filters.limit);

    if (totalPages <= 1) return null;

    return (
        <div className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex gap-2">
                {currentPage > 1 && (
                    <button
                        onClick={() => router.get(route('admin.works.onchain.index'), {
                            ...filters,
                            offset: filters.offset - filters.limit,
                        })}
                        className="px-3 py-1 border rounded hover:bg-gray-50"
                    >
                        Sebelumnya
                    </button>
                )}
                {currentPage < totalPages && (
                    <button
                        onClick={() => router.get(route('admin.works.onchain.index'), {
                            ...filters,
                            offset: filters.offset + filters.limit,
                        })}
                        className="px-3 py-1 border rounded hover:bg-gray-50"
                    >
                        Selanjutnya
                    </button>
                )}
            </div>
        </div>
    );
}