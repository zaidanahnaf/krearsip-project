import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminWorkService, authService } from "../../api/services";
import type { AdminWork, UserProfile } from "../../api/types";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../api/client";

type LoadingState = {
    page: boolean;
    actionId: string | null; // ID karya yang lagi diproses
};

export function AdminDashboard() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfile | null>(null);

    const [draftQueue, setDraftQueue] = useState<AdminWork[]>([]);
    const [deployQueue, setDeployQueue] = useState<AdminWork[]>([]);
    const [onchainWorks, setOnchainWorks] = useState<AdminWork[]>([]);
    const [verifiedWorks, setVerifiedWorks] = useState<AdminWork[]>([]);

    const [loading, setLoading] = useState<LoadingState>({
        page: true,
        actionId: null,
    });
    const [error, setError] = useState<string | null>(null);

    // Redirect kalau nggak ada token
    useEffect(() => {
        if (!token) {
            navigate("/admin-login", { replace: true });
        }
    }, [token, navigate]);

    // Load data awal
    useEffect(() => {
        if (!token) return;

        const loadData = async () => {
            setLoading((prev) => ({ ...prev, page: true }));
            setError(null);
            try {
                const [me, drafts, readyDeploy, onchainRes, verifiedRes] =
                    await Promise.all([
                        authService.getProfile(),
                        adminWorkService.getDraftQueue(),
                        adminWorkService.getConfirmedQueue(),
                        adminWorkService.listWorks({ queue: "onchain", limit: 50 }),
                        adminWorkService.listWorks({ queue: "verified", limit: 50 }),
                    ]);
                setProfile(me);
                setDraftQueue(drafts);
                setDeployQueue(readyDeploy);
                setOnchainWorks(onchainRes.items);
                setVerifiedWorks(verifiedRes.items);
            } catch (err: any) {
                console.error("Failed to load admin dashboard data:", err);
                if (err instanceof ApiError) {
                    if (err.status === 401 || err.status === 403) {
                        setError("Sesi admin berakhir atau tidak punya akses. Silakan login ulang.");
                        logout();
                        navigate("/admin-login", { replace: true });
                        return;
                    }
                    setError(err.message);
                } else {
                    setError(err?.message || "Gagal memuat data dashboard");
                }
            } finally {
                setLoading((prev) => ({ ...prev, page: false }));
            }
        };

        loadData();
    }, [logout, navigate, token]);

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    // ==== Helpers: rules & label status ====

    function getStatusBadge(work: AdminWork): { label: string; className: string } {
        const { status, status_onchain } = work;

        if (status === "terverifikasi") {
            return {
                label: "Terverifikasi",
                className: "bg-emerald-100 text-emerald-700",
            };
        }

        if (status === "on_chain") {
            if (status_onchain === "berhasil") {
                return {
                    label: "On-Chain (Berhasil)",
                    className: "bg-green-100 text-green-700",
                };
            }
            if (status_onchain === "gagal") {
                return {
                    label: "On-Chain (Gagal)",
                    className: "bg-red-100 text-red-700",
                };
            }
            if (status_onchain === "dalam antrian") {
                return {
                    label: "On-Chain (Diproses)",
                    className: "bg-blue-100 text-blue-700",
                };
            }
            return {
                label: "On-Chain",
                className: "bg-blue-100 text-blue-700",
            };
        }

        // status === "draft"
        if (status_onchain === "menunggu") {
            return {
                label: "Terkonfirmasi (Menunggu Deploy)",
                className: "bg-amber-100 text-amber-800",
            };
        }
        if (status_onchain === "dalam antrian") {
            return {
                label: "Diproses",
                className: "bg-blue-100 text-blue-700",
            };
        }
        if (status_onchain === "gagal") {
            return {
                label: "Draft (Ditolak / Gagal)",
                className: "bg-red-100 text-red-700",
            };
        }

        // "tidak ada"
        return {
            label: "Draft",
            className: "bg-slate-100 text-slate-700",
        };
    }

    function canApprove(work: AdminWork): boolean {
        return (
            work.status === "draft" &&
            (work.status_onchain === "tidak ada" || work.status_onchain === "gagal")
        );
    }

    function canReject(work: AdminWork): boolean {
        return work.status === "draft";
    }

    function canDeploy(work: AdminWork): boolean {
        return work.status === "draft" && work.status_onchain === "menunggu";
    }

    function canSyncTx(work: AdminWork): boolean {
        return (
            work.status === "on_chain" &&
            !!work.tx_hash &&
            work.block_number == null
        );
    }

    function canVerify(work: AdminWork): boolean {
        return (
            work.status === "on_chain" &&
            work.status_onchain === "berhasil"
        );
    }

    const isActionLoading = (id: string) => loading.actionId === id;

    // ==== Actions ====

    const refreshQueues = async () => {
        try {
            const [drafts, readyDeploy, onchainRes, verifiedRes] = await Promise.all([
                adminWorkService.getDraftQueue(),
                adminWorkService.getOnchainQueue(),
                adminWorkService.getOnchainQueue({ queue: "onchain", limit: 50 }),
                adminWorkService.getOnchainQueue({ queue: "verified", limit: 50 }),
            ]);
            setDraftQueue(drafts);
            setDeployQueue(readyDeploy);
            setOnchainWorks(onchainRes.items);
            setVerifiedWorks(verifiedRes.items);
        } catch (err) {
            console.error("Failed to refresh queues:", err);
        }
    };

    const handleApprove = async (work: AdminWork) => {
        if (!canApprove(work)) return;

        setLoading({ page: false, actionId: work.id });
        setError(null);
        try {
            await adminWorkService.approveWork(work.id);
            await refreshQueues();
        } catch (err: any) {
            console.error("Failed to approve work:", err);
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err?.message || "Gagal menyetujui karya");
            }
        } finally {
            setLoading({ page: false, actionId: null });
        }
    };

    const handleReject = async (work: AdminWork) => {
        if (!canReject(work)) return;

        setLoading({ page: false, actionId: work.id });
        setError(null);
        try {
            await adminWorkService.rejectWork(work.id);
            await refreshQueues();
        } catch (err: any) {
            console.error("Failed to reject work:", err);
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err?.message || "Gagal menolak karya");
            }
        } finally {
            setLoading({ page: false, actionId: null });
        }
    };

    const handleDeploy = async (work: AdminWork) => {
        if (!canDeploy(work)) return;

        setLoading({ page: false, actionId: work.id });
        setError(null);
        try {
            await adminWorkService.deployWork(work.id);
            await refreshQueues();
        } catch (err: any) {
            console.error("Failed to deploy work:", err);
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err?.message || "Gagal mem-publish ke on-chain");
            }
        } finally {
            setLoading({ page: false, actionId: null });
        }
    };

    const handleSyncTx = async (work: AdminWork) => {
        if (!canSyncTx(work) || !work.tx_hash) return;

        setLoading({ page: false, actionId: work.id });
        setError(null);
        try {
            await adminWorkService.syncTx(work.tx_hash);
            await refreshQueues();
        } catch (err: any) {
            console.error("Failed to sync tx:", err);
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err?.message || "Gagal sync transaksi dari chain");
            }
        } finally {
            setLoading({ page: false, actionId: null });
        }
    };

    const handleVerify = async (work: AdminWork) => {
        if (!canVerify(work)) return;

        setLoading({ page: false, actionId: work.id });
        setError(null);
        try {
            await adminWorkService.verifyWork(work.id);
            await refreshQueues();
        } catch (err: any) {
            console.error("Failed to verify work:", err);
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err?.message || "Gagal memverifikasi karya");
            }
        } finally {
            setLoading({ page: false, actionId: null });
        }
    };

    if (!token) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="w-full border-b bg-white">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">
                            Krearsip — Admin Dashboard
                        </h1>
                        <p className="text-sm text-slate-500">
                            Kelola karya kreator, approval, dan proses on-chain.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {profile && (
                            <div className="text-right">
                                <div className="text-sm font-medium text-slate-800">
                                    {profile.nama_tampil ?? "Admin"}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {profile.email ?? profile.alamat_wallet}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading.page && (
                    <div className="text-sm text-slate-500">Memuat data dashboard…</div>
                )}

                {/* Section 1: Draft Queue */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Draft Queue (Butuh Review)
                            </h2>
                            <p className="text-xs text-slate-500">
                                Karya baru / gagal yang perlu di-approve atau ditolak.
                            </p>
                        </div>
                        <span className="text-xs text-slate-500">
                            Total: {draftQueue.length}
                        </span>
                    </div>

                    {draftQueue.length === 0 ? (
                        <div className="text-sm text-slate-500">
                            Belum ada karya di antrian review.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {draftQueue.map((work) => {
                                const badge = getStatusBadge(work);
                                const disabledApprove =
                                    !canApprove(work) || isActionLoading(work.id);
                                const disabledReject =
                                    !canReject(work) || isActionLoading(work.id);

                                return (
                                    <div
                                        key={work.id}
                                        className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-medium text-slate-900">
                                                    {work.judul}
                                                </h3>
                                                <span
                                                    className={
                                                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                                                        badge.className
                                                    }
                                                >
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 space-x-2">
                                                <span>{work.email ?? work.alamat_wallet}</span>
                                                <span>•</span>
                                                <span>Status on-chain: {work.status_onchain}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApprove(work)}
                                                disabled={disabledApprove}
                                                className={
                                                    "px-3 py-1.5 rounded-md text-xs font-medium border transition " +
                                                    (disabledApprove
                                                        ? "bg-emerald-50 border-emerald-100 text-emerald-400 cursor-not-allowed"
                                                        : "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600")
                                                }
                                            >
                                                {isActionLoading(work.id) ? "Memproses…" : "Approve"}
                                            </button>
                                            <button
                                                onClick={() => handleReject(work)}
                                                disabled={disabledReject}
                                                className={
                                                    "px-3 py-1.5 rounded-md text-xs font-medium border transition " +
                                                    (disabledReject
                                                        ? "bg-red-50 border-red-100 text-red-300 cursor-not-allowed"
                                                        : "bg-white border-red-300 text-red-600 hover:bg-red-50")
                                                }
                                            >
                                                {isActionLoading(work.id) ? "Memproses…" : "Reject"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Section 2: Siap Deploy */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Siap Deploy ke Blockchain
                            </h2>
                            <p className="text-xs text-slate-500">
                                Karya yang sudah di-approve dan menunggu proses deploy on-chain.
                            </p>
                        </div>
                        <span className="text-xs text-slate-500">
                            Total: {deployQueue.length}
                        </span>
                    </div>

                    {deployQueue.length === 0 ? (
                        <div className="text-sm text-slate-500">
                            Belum ada karya yang siap di-deploy.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {deployQueue.map((work) => {
                                const badge = getStatusBadge(work);
                                const disabledDeploy =
                                    !canDeploy(work) || isActionLoading(work.id);

                                return (
                                    <div
                                        key={work.id}
                                        className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-medium text-slate-900">
                                                    {work.judul}
                                                </h3>
                                                <span
                                                    className={
                                                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                                                        badge.className
                                                    }
                                                >
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 space-x-2 mb-1">
                                                <span>{work.email ?? work.alamat_wallet}</span>
                                                <span>•</span>
                                                <span>Status on-chain: {work.status_onchain}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <button
                                                onClick={() => handleDeploy(work)}
                                                disabled={disabledDeploy}
                                                className={
                                                    "px-3 py-1.5 rounded-md text-xs font-medium border transition " +
                                                    (disabledDeploy
                                                        ? "bg-indigo-50 border-indigo-100 text-indigo-300 cursor-not-allowed"
                                                        : "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700")
                                                }
                                            >
                                                {isActionLoading(work.id)
                                                    ? "Memproses…"
                                                    : "Deploy ke Chain"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Section 3: On-Chain & Terverifikasi */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-6">
                    {/* 3a. On-Chain */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">
                                    On-Chain (Perlu Monitoring)
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Karya yang sudah berstatus on-chain — bisa sync TX & verifikasi.
                                </p>
                            </div>
                            <span className="text-xs text-slate-500">
                                Total: {onchainWorks.length}
                            </span>
                        </div>

                        {onchainWorks.length === 0 ? (
                            <div className="text-sm text-slate-500">
                                Belum ada karya yang on-chain.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {onchainWorks.map((work) => {
                                    const badge = getStatusBadge(work);
                                    const disabledSync =
                                        !canSyncTx(work) || isActionLoading(work.id);
                                    const disabledVerify =
                                        !canVerify(work) || isActionLoading(work.id);

                                    return (
                                        <div
                                            key={work.id}
                                            className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-medium text-slate-900">
                                                        {work.judul}
                                                    </h3>
                                                    <span
                                                        className={
                                                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                                                            badge.className
                                                        }
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 space-x-2 mb-1">
                                                    <span>{work.email ?? work.alamat_wallet}</span>
                                                    <span>•</span>
                                                    <span>Status on-chain: {work.status_onchain}</span>
                                                    {work.block_number != null && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Block #{work.block_number}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {work.tx_hash && (
                                                    <div className="text-[11px] text-slate-500">
                                                        TX:{" "}
                                                        {work.etherscan_url ? (
                                                            <a
                                                                href={work.etherscan_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="underline hover:text-slate-700"
                                                            >
                                                                {work.tx_hash.slice(0, 10)}…
                                                            </a>
                                                        ) : (
                                                            work.tx_hash
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <button
                                                    onClick={() => handleSyncTx(work)}
                                                    disabled={disabledSync}
                                                    className={
                                                        "px-3 py-1.5 rounded-md text-xs font-medium border transition " +
                                                        (disabledSync
                                                            ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100")
                                                    }
                                                >
                                                    {isActionLoading(work.id) ? "Memproses…" : "Sync TX"}
                                                </button>
                                                <button
                                                    onClick={() => handleVerify(work)}
                                                    disabled={disabledVerify}
                                                    className={
                                                        "px-3 py-1.5 rounded-md text-xs font-medium border transition " +
                                                        (disabledVerify
                                                            ? "bg-emerald-50 border-emerald-100 text-emerald-300 cursor-not-allowed"
                                                            : "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600")
                                                    }
                                                >
                                                    {isActionLoading(work.id)
                                                        ? "Memproses…"
                                                        : "Verifikasi"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 3b. Verified */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">
                                    Arsip Terverifikasi
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Karya yang sudah final, diverifikasi dan tercatat on-chain.
                                </p>
                            </div>
                            <span className="text-xs text-slate-500">
                                Total: {verifiedWorks.length}
                            </span>
                        </div>

                        {verifiedWorks.length === 0 ? (
                            <div className="text-sm text-slate-500">
                                Belum ada karya yang terverifikasi.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {verifiedWorks.map((work) => {
                                    const badge = getStatusBadge(work);

                                    return (
                                        <div
                                            key={work.id}
                                            className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-medium text-slate-900">
                                                        {work.judul}
                                                    </h3>
                                                    <span
                                                        className={
                                                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                                                            badge.className
                                                        }
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 space-x-2 mb-1">
                                                    <span>{work.email ?? work.alamat_wallet}</span>
                                                    <span>•</span>
                                                    <span>Status on-chain: {work.status_onchain}</span>
                                                    {work.block_number != null && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Block #{work.block_number}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {work.tx_hash && (
                                                    <div className="text-[11px] text-slate-500">
                                                        TX:{" "}
                                                        {work.etherscan_url ? (
                                                            <a
                                                                href={work.etherscan_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="underline hover:text-slate-700"
                                                            >
                                                                {work.tx_hash.slice(0, 10)}…
                                                            </a>
                                                        ) : (
                                                            work.tx_hash
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Verified: mostly read-only, nggak ada tombol aksi */}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
