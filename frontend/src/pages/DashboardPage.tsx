import { useEffect, useState } from "react";
import { apiGetAuth, apiPostAuth } from "../api/client";
import type { CreatorWork } from "../api/types";
import { loginWithSiwe } from "../auth/siweAuth";

declare global {
    interface Window {
        ethereum?: any;
    }
}

interface AuthState {
    token: string | null;
    wallet: string | null;
}

export function CreatorDashboardPage() {
    const [auth, setAuth] = useState<AuthState>({
        token: null,
        wallet: null,
    });

    const [works, setWorks] = useState<CreatorWork[]>([]);
    const [loadingWorks, setLoadingWorks] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [worksError, setWorksError] = useState<string | null>(null);

    // form state
    const [judulBaru, setJudulBaru] = useState("");
    const [fileBaru, setFileBaru] = useState<File | null>(null);
    const [creating, setCreating] = useState(false);

    // baca token dari localStorage saat awal
    useEffect(() => {
        const token = localStorage.getItem("creaproof_token");
        const wallet = localStorage.getItem("creaproof_wallet");
        if (token && wallet) {
            setAuth({ token, wallet });
        }
    }, []);

    // kalau sudah logged-in, load karya
    useEffect(() => {
        if (auth.token) {
            loadWorks(auth.token);
        }
    }, [auth.token]);

    async function loadWorks(token: string) {
        setLoadingWorks(true);
        setWorksError(null);
        try {
            const res = await apiGetAuth("/works", token);
            // sesuaikan dengan bentuk response backend kamu
            // misal: { items: [...], total, ... } atau langsung array
            if (Array.isArray(res)) {
                setWorks(res as CreatorWork[]);
            } else if (Array.isArray(res.items)) {
                setWorks(res.items as CreatorWork[]);
            } else {
                setWorks([]);
            }
        } catch (e: any) {
            setWorksError(e?.message ?? "Gagal memuat daftar karya.");
        } finally {
            setLoadingWorks(false);
        }
    }

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

    async function hashFileSHA256(file: File): Promise<string> {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return hashHex;
    }

    async function handleCreateDraft(e: React.FormEvent) {
        e.preventDefault();
        if (!auth.token) {
            setAuthError("Silakan login dengan wallet terlebih dahulu.");
            return;
        }
        if (!judulBaru.trim()) {
            alert("Judul tidak boleh kosong.");
            return;
        }
        if (!fileBaru) {
            alert("Pilih berkas karya terlebih dahulu.");
            return;
        }

        try {
            setCreating(true);
            setWorksError(null);

            // 1. Hash file di frontend
            const hash = await hashFileSHA256(fileBaru);

            // 2. Kirim ke backend sebagai draft
            const body = {
                judul: judulBaru.trim(),
                hash_berkas: hash,
            };
            const res = await apiPostAuth("/works", auth.token, body);

            // 3. Tambahkan ke list
            setWorks((prev) => [res as CreatorWork, ...prev]);

            // 4. Reset form
            setJudulBaru("");
            setFileBaru(null);
            const fi = document.getElementById("file-input") as HTMLInputElement | null;
            if (fi) {
                fi.value = "";
            }
        } catch (e: any) {
            setWorksError(e?.message ?? "Gagal membuat draft karya.");
        } finally {
            setCreating(false);
        }
    }

    // function getOnChainText(w: CreatorWorkRow) {
    //     if (k.status === "terverifikasi") {
    //         return "On-chain & terverifikasi";
    //     }
    //     if (k.tx_hash) {
    //         return "Sudah on-chain (menunggu verifikasi)";
    //     }
    //     return "Belum on-chain";
    // }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Dashboard Pencipta
                    </h1>
                    <p className="text-sm text-slate-600">
                        Kelola karya yang ingin kamu lindungi. Sistem hanya menyimpan{" "}
                        <span className="font-semibold">hash berkas</span>, bukan isi file.
                    </p>
                </div>
                <div className="text-right">
                    {auth.wallet ? (
                        <div className="text-xs text-slate-600">
                            Terhubung sebagai
                            <div className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded mt-1">
                                {auth.wallet}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogin}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            Connect Wallet &amp; Login
                        </button>
                    )}
                    {authError && (
                        <p className="text-[11px] text-red-600 mt-1 max-w-xs">
                            {authError}
                        </p>
                    )}
                </div>
            </header>

            {/* Form draft baru */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">
                    Daftarkan Karya Baru (Draft)
                </h2>
                <p className="text-xs text-slate-500">
                    Sistem akan menghitung hash SHA-256 di browser dan hanya mengirim
                    hash ke server. File asli tetap berada di perangkatmu.
                </p>

                <form onSubmit={handleCreateDraft} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            Judul Karya
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={judulBaru}
                            onChange={(e) => setJudulBaru(e.target.value)}
                            placeholder="Misal: Kau dan Aku (versi final)"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            File Karya (untuk dihitung hash-nya)
                        </label>
                        <input
                            id="file-input"
                            type="file"
                            className="text-xs"
                            onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setFileBaru(f);
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={creating || !auth.token}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {creating ? "Mendaftar..." : "Buat Draft Karya"}
                    </button>
                </form>

                {!auth.token && (
                    <p className="text-[11px] text-amber-600 mt-2">
                        Kamu perlu login dengan wallet terlebih dahulu sebelum bisa membuat
                        draft karya.
                    </p>
                )}
            </section>

            {/* List karya */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-800">
                        Karya Milik Kamu
                    </h2>
                    {loadingWorks && (
                        <span className="text-[11px] text-slate-500">
                            Memuat daftar karya...
                        </span>
                    )}
                </div>

                {worksError && (
                    <p className="text-xs text-red-600 mb-2">{worksError}</p>
                )}

                {works.length === 0 && !loadingWorks ? (
                    <p className="text-xs text-slate-500">
                        Belum ada karya yang terdaftar. Mulai dengan membuat draft di atas.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs border-t border-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left px-3 py-2 font-medium text-slate-600">
                                        Judul
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-slate-600">
                                        Status
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-slate-600">
                                        Jaringan
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-slate-600">
                                        Terakhir Update
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-slate-600">
                                        On-chain
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {works.map((w) => (
                                    <tr key={k.id} className="border-b border-slate-100">
                                        <td className="px-3 py-2 align-top">
                                            <div className="font-medium text-slate-900">
                                                {k.judul}
                                            </div>
                                            <div className="font-mono text-[10px] text-slate-500 break-all">
                                                {k.hash_berkas}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 align-top">
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${k.status === "terverifikasi"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : k.status === "on_chain"
                                                        ? "bg-indigo-100 text-indigo-700"
                                                        : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {k.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 align-top text-slate-700">
                                            {k.jaringan_ket ?? "-"}
                                        </td>
                                        <td className="px-3 py-2 align-top text-slate-700">
                                            {new Date(k.updated_at).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 align-top">
                                            {k.etherscan_url ? (
                                                // <div className="flex flex-col gap-0.5">
                                                //     <span className="text-[11px] text-emerald-600 font-medium">
                                                //         {getOnChainText(w)}
                                                //     </span>
                                                <a
                                                    href={k.etherscan_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[11px] text-indigo-600 hover:underline"
                                                >
                                                    Lihat tx
                                                </a>
                                                // </div>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">
                                                    Belum on-chain
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
                }
            </section >
        </div >
    );
}
