// src/pages/VerifierDashboardPage.tsx
import React, { useEffect, useState } from "react";
import { apiGetAuth, apiPostAuth } from "../api/client";
import type { VerifierWorkRow } from "../types";
import { loginWithSiwe } from "../auth/siweAuth";
import { format } from "date-fns";

interface AuthState {
    token: string | null;
    wallet: string | null;
}

export const VerifierDashboardPage: React.FC = () => {
    const [auth, setAuth] = useState<AuthState>({ token: null, wallet: null });
    const [authError, setAuthError] = useState<string | null>(null);

    const [works, setWorks] = useState<VerifierWorkRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("on_chain"); // fokus karya yg perlu diverifikasi
    const [search, setSearch] = useState("");

    // Ambil token/wallet dari localStorage (sama kayak CreatorDashboard)
    useEffect(() => {
        const token = localStorage.getItem("creaproof_token");
        const wallet = localStorage.getItem("creaproof_wallet");
        if (token && wallet) {
            setAuth({ token, wallet });
        }
    }, []);

    async function loadWorks(token: string) {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set("status", statusFilter);
            if (search.trim()) params.set("q", search.trim());

            const query = params.toString() ? `?${params.toString()}` : "";
            const res = await apiGetAuth(`/admin/works${query}`, token);
            setWorks(res.items as VerifierWorkRow[]);
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "Gagal memuat daftar karya.");
        } finally {
            setLoading(false);
        }
    }

    // Reload ketika token berubah (misal habis login)
    useEffect(() => {
        if (auth.token) {
            loadWorks(auth.token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.token]);

    async function handleLogin() {
        try {
            setAuthError(null);
            const result = await loginWithSiwe();
            localStorage.setItem("creaproof_token", result.token);
            localStorage.setItem("creaproof_wallet", result.wallet);
            setAuth({ token: result.token, wallet: result.wallet });
        } catch (e: any) {
            setAuthError(e?.message ?? "Gagal login dengan wallet.");
        }
    }

    async function handleSyncTx(w: VerifierWorkRow) {
        if (!auth.token || !k.tx_hash) return;
        const ok = confirm(
            `Sync dari chain untuk karya:\n\n"${k.judul}"\n\nTx: ${k.tx_hash.slice(
                0,
                18
            )}... ?`
        );
        if (!ok) return;

        try {
            await apiPostAuth(`/admin/sync-tx/${k.tx_hash}`, auth.token, {});
            await loadWorks(auth.token);
        } catch (e: any) {
            alert(e?.message ?? "Gagal sync dari chain");
        }
    }

    async function handleVerify(w: VerifierWorkRow) {
        if (!auth.token) return;
        const ok = confirm(
            `Tandai karya ini sebagai TER-VERIFIKASI?\n\n"${k.judul}"\nPemilik: ${k.alamat_wallet}`
        );
        if (!ok) return;

        try {
            // ⚠️ penting: endpoint backend kita adalah /admin/works/{karya_id}/verify
            await apiPostAuth(`/admin/works/${k.id}/verify`, auth.token, {});
            await loadWorks(auth.token);
        } catch (e: any) {
            alert(e?.message ?? "Gagal memverifikasi karya");
        }
    }

    // Kalau belum login, tampilkan UI login + info role
    if (!auth.token) {
        return (
            <div className="max-w-4xl mx-auto py-10 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold mb-1">
                            Dashboard Verifikator
                        </h1>
                        <p className="text-sm text-slate-600">
                            Untuk mengakses halaman ini, login dengan wallet yang
                            di-database punya peran{" "}
                            <span className="font-mono">verifikator</span> atau{" "}
                            <span className="font-mono">admin</span>.
                        </p>
                    </div>
                    <button
                        onClick={handleLogin}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        Connect Wallet &amp; Login
                    </button>
                </div>
                {authError && (
                    <p className="text-xs text-red-600 max-w-md">{authError}</p>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-10 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard Verifikator</h1>
                    <p className="text-sm text-slate-600">
                        Lihat karya yang sudah on-chain, cek hash & tx, lalu tandai
                        sebagai <span className="font-semibold">TERVERIFIKASI</span>.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                        Login sebagai:{" "}
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                            {auth.wallet}
                        </span>
                    </p>
                </div>

                <button
                    onClick={() => auth.token && loadWorks(auth.token)}
                    className="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
                >
                    Refresh
                </button>
            </div>

            <div className="flex flex-wrap gap-3 items-center text-sm">
                <label className="flex items-center gap-2">
                    <span>Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                    >
                        <option value="">Semua</option>
                        <option value="on_chain">Hanya ON_CHAIN</option>
                        <option value="terverifikasi">Hanya TERVERIFIKASI</option>
                        <option value="draft">Hanya DRAFT</option>
                    </select>
                </label>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (auth.token) loadWorks(auth.token);
                    }}
                    className="flex items-center gap-2"
                >
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari judul..."
                        className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs"
                    >
                        Cari
                    </button>
                </form>

                {loading && (
                    <span className="text-xs text-slate-500">Memuat data...</span>
                )}
                {error && (
                    <span className="text-xs text-red-500">Error: {error}</span>
                )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-3 py-2 text-left">Judul</th>
                            <th className="px-3 py-2 text-left">Pemilik</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">On-chain</th>
                            <th className="px-3 py-2 text-left">Terakhir</th>
                            <th className="px-3 py-2 text-left">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {works.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-3 py-6 text-center text-slate-500 text-sm"
                                >
                                    Belum ada data sesuai filter.
                                </td>
                            </tr>
                        )}
                        {works.map((w) => (
                            <tr key={k.id} className="border-t border-slate-100">
                                <td className="px-3 py-2 align-top">
                                    <div className="font-medium text-slate-900">
                                        {k.judul}
                                    </div>
                                    <div className="text-[11px] text-slate-500 break-all">
                                        tx: {k.tx_hash || "—"}
                                    </div>
                                </td>
                                <td className="px-3 py-2 align-top text-xs">
                                    <div className="font-mono text-[11px] break-all">
                                        {k.alamat_wallet}
                                    </div>
                                    {k.email && (
                                        <div className="text-[11px] text-slate-500">
                                            {k.email}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2 align-top text-xs">
                                    <span
                                        className={
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium " +
                                            (k.status === "terverifikasi"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : k.status === "on_chain"
                                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                    : "bg-slate-50 text-slate-600 border border-slate-200")
                                        }
                                    >
                                        {k.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-3 py-2 align-top text-xs">
                                    {k.etherscan_url ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] text-emerald-600 font-medium">
                                                Tx #{k.block_number ?? "—"}
                                            </span>
                                            <a
                                                href={k.etherscan_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[11px] text-indigo-600 hover:underline"
                                            >
                                                Lihat di Etherscan
                                            </a>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-slate-400">
                                            Belum on-chain
                                        </span>
                                    )}
                                </td>
                                <td className="px-3 py-2 align-top text-xs text-slate-500">
                                    {format(
                                        new Date(k.updated_at),
                                        "dd/MM/yyyy HH:mm"
                                    )}
                                </td>
                                <td className="px-3 py-2 align-top text-xs space-y-1">
                                    <button
                                        disabled={!k.tx_hash}
                                        onClick={() => handleSyncTx(w)}
                                        className="block w-full text-left px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Sync dari chain
                                    </button>
                                    <button
                                        disabled={
                                            k.status !== "on_chain" ||
                                            !k.tx_hash ||
                                            !k.block_number
                                        }
                                        onClick={() => handleVerify(w)}
                                        className="block w-full text-left px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Tandai terverifikasi
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
