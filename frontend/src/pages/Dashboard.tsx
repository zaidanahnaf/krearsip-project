import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService, workService } from "../api/services";
import type { UserProfile, Work } from "../api/types";
import { DashboardHeader } from "../components/DashboardHeader";
import { OverviewSection } from "../components/OverviewSection";
import { WorksList } from "../components/WorksList";
import { CreateWorkForm } from "../components/CreateWorkForm";
import { useAuth } from "../hooks/useAuth"

export function Dashboard() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [works, setWorks] = useState<Work[]>([]);
    const [isLoadingWorks, setIsLoadingWorks] = useState(true);
    const [worksError, setWorksError] = useState<string | null>(null);


    // Load token and wallet from localStorage
    useEffect(() => {
        const w = localStorage.getItem("WALLET_KEY");
        setWalletAddress(w);
    }, []);

    // Fetch profile & works
    useEffect(() => {
        const loadData = async () => {
            if (!token) return;
            try {
                setIsLoadingWorks(true);
                const profileData = await authService.getProfile();
                const worksData = await workService.getWorks();
                setProfile(profileData);
                setWorks(worksData);
            } catch (err: any) {
                console.error("Failed to load dashboard data:", err);
                setWorksError(err.message || "Gagal memuat data karya");
            } finally {
                setIsLoadingWorks(false);
            }
        };
        loadData();
    }, [token]);

    const handleLogout = () => {
        logout();
        setWalletAddress(null);
        setWorks([]);

        navigate("/", { replace: true });
    };

    const handleWorkCreated = (newWork: Work) => {
        setWorks((prev) => [newWork, ...prev]);
    };

    // Not authenticated
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8F9FB" }}>
                <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full text-center border">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#6658DD" }}>
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: "#1A1A2E" }}>
                        Token Tidak Ditemukan
                    </h2>
                    <p className="mb-6" style={{ color: "#6E7582" }}>
                        Silakan login kembali untuk mengakses dashboard.
                    </p>
                    <button
                        onClick={() => (window.location.href = "/login")}
                        className="px-6 py-3 rounded-lg text-white font-medium w-full"
                        style={{ backgroundColor: "#6658DD" }}
                    >
                        Ke Halaman Login
                    </button>
                </div>
            </div>
        );
    }

    // Authenticated view
    return (
        <div className="min-h-screen" style={{ backgroundColor: "#F8F9FB" }}>
            <DashboardHeader walletAddress={walletAddress} onLogout={handleLogout} />

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <OverviewSection works={works} />
                        <div>
                            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1A1A2E" }}>
                                Daftar Karya
                            </h2>
                            <WorksList works={works} isLoading={isLoadingWorks} error={worksError} />
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="lg:col-span-1">
                        <CreateWorkForm token={token} onWorkCreated={handleWorkCreated} />
                    </div>
                </div>
            </div>
        </div>
    );
}
