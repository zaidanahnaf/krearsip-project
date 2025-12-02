import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "../../components/DashboardHeader";
import type { UserProfile, AdminWorkItem } from "../../api/types";
import { authService, adminWorkService } from "../../api/services";
import { useAuth } from "../../hooks/useAuth";

import { DraftQueue } from "./sections/DraftQueue";
import { OnchainQueue } from "./sections/OnchainQueue";
import { VerifiedList } from "./sections/VerifiedList";
import { Footer } from "../../components/Footer";

export function AdminDashboard() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const [draftItems, setDraftItems] = useState<AdminWorkItem[]>([]);
    const [onchainItems, setOnchainItems] = useState<AdminWorkItem[]>([]);
    const [verifiedItems, setVerifiedItems] = useState<AdminWorkItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [actionBusyId, setActionBusyId] = useState<string | null>(null);

    // Load wallet
    useEffect(() => {
        const w = localStorage.getItem("WALLET_KEY");
        setWalletAddress(w);
    }, []);

    // Main loader
    async function loadAll() {
        if (!token) return;

        setLoading(true);
        setErrMsg(null);
        try {
            const profileData = await authService.getProfile();
            setProfile(profileData);

            const [draftRes, onchainRes, verifiedRes] = await Promise.all([
                adminWorkService.getDraftQueue(),
                adminWorkService.getOnchainQueue(),
                adminWorkService.getVerifiedQueue(),
            ]);

            setDraftItems(draftRes.items);
            setOnchainItems(onchainRes.items);
            setVerifiedItems(verifiedRes.items);
        } catch (err: any) {
            console.error("Failed to load admin dashboard data:", err);
            setErrMsg(err?.message || "Gagal memuat data admin");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, [token]); // ⬅ token berubah → reload

    const handleLogout = () => {
        logout();
        setWalletAddress(null);
        navigate("/", { replace: true });
    };

    // Actions
    const handleApprove = async (id: string) => {
        setActionBusyId(id);
        try {
            await adminWorkService.approveWork(id);
            await loadAll();
        } catch (err: any) {
            setErrMsg(err?.message || "Gagal approve karya");
        } finally {
            setActionBusyId(null);
        }
    };

    const handleReject = async (id: string) => {
        setActionBusyId(id);
        try {
            await adminWorkService.rejectWork(id, { reason: "Ditolak oleh admin" });
            await loadAll();
        } catch (err: any) {
            setErrMsg(err?.message || "Gagal reject karya");
        } finally {
            setActionBusyId(null);
        }
    };

    const handleDeploy = async (id: string) => {
        setActionBusyId(id);
        try {
            await adminWorkService.deployWork(id);
            await loadAll();
        } catch (err: any) {
            setErrMsg(err?.message || "Gagal deploy ke chain");
        } finally {
            setActionBusyId(null);
        }
    };

    const handleSync = async (work: AdminWorkItem) => {
        if (!work.tx_hash) return;
        setActionBusyId(work.id);
        try {
            await adminWorkService.syncTx(work.tx_hash);
            await loadAll();
        } catch (err: any) {
            setErrMsg(err?.message || "Gagal sync ke chain");
        } finally {
            setActionBusyId(null);
        }
    };

    const handleVerify = async (id: string) => {
        setActionBusyId(id);
        try {
            await adminWorkService.verifyWork(id);
            await loadAll();
        } catch (err: any) {
            setErrMsg(err?.message || "Gagal verifikasi karya");
        } finally {
            setActionBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* HEADER ADA DI ATAS */}
            <DashboardHeader
                walletAddress={walletAddress}
                onLogout={handleLogout}
            />

            <div className="flex items-center justify-between px-8">
                <h2 className="text-lg font-semibold">Dashboard Admin</h2>

                <button
                    onClick={loadAll}
                    className="rounded-md border px-3 py-1 text-sm"
                    disabled={loading}
                >
                    {loading ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            {errMsg && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errMsg}
                </div>
            )}

            {/* GRID 3 KOLOM */}
            <div className="gap-6">
                <div className="bg-white border rounded-xl shadow-sm p-4 max-h-[75vh] overflow-y-auto">
                    <DraftQueue
                        works={draftItems}
                        loading={loading}
                        actionBusyId={actionBusyId}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDeploy={handleDeploy}
                        onSync={handleSync}
                        onVerify={handleVerify}
                    />
                </div>

                <div className="bg-white border rounded-xl shadow-sm p-4 max-h-[75vh] overflow-y-auto">
                    <OnchainQueue
                        works={onchainItems}
                        actionBusyId={actionBusyId}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDeploy={handleDeploy}
                        onSync={handleSync}
                        onVerify={handleVerify}
                    />
                </div>

                <div className="bg-white border rounded-xl shadow-sm p-4 max-h-[75vh] overflow-y-auto">
                    <VerifiedList
                        works={verifiedItems}
                        actionBusyId={actionBusyId}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDeploy={handleDeploy}
                        onSync={handleSync}
                        onVerify={handleVerify}
                    />
                </div>
            </div>
            < Footer />
        </div>
    );
}
