import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { PublicWorkDetail } from "../api/types";

export function PublicWorkDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<PublicWorkDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get<PublicWorkDetail>(`/public/works/${id}`);
                setData(res);
            } catch (e: any) {
                setError(e?.message ?? "Gagal memuat detail karya");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (!id) {
        return <div className="text-sm text-red-600">ID karya tidak valid.</div>;
    }

    if (loading) {
        return <div className="text-sm text-slate-600">Memuat detail karya...</div>;
    }

    if (error) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-red-600">Error: {error}</p>
                <Link
                    to="/"
                    className="inline-block text-sm text-indigo-600 hover:underline"
                >
                    &laquo; Kembali ke daftar karya
                </Link>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-slate-600">Karya tidak ditemukan.</p>
                <Link
                    to="/"
                    className="inline-block text-sm text-indigo-600 hover:underline"
                >
                    &laquo; Kembali ke daftar karya
                </Link>
            </div>
        );
    }

    const {
        judul,
        status,
        hash_berkas,
        tx_hash,
        alamat_kontrak,
        jaringan_ket,
        block_number,
        waktu_blok,
        updated_at,
        etherscan_url,
    } = data;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link
                to="/"
                className="inline-flex items-center text-xs text-indigo-600 hover:underline"
            >
                &laquo; Kembali ke daftar karya
            </Link>

            {/* Header karya */}
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 mb-1">
                        {judul}
                    </h1>
                    <p className="text-sm text-slate-500">
                        ID internal:{" "}
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                            {data.id}
                        </span>
                    </p>
                </div>
                <span
                    className={`text-[11px] px-3 py-1 rounded-full font-semibold ${status === "terverifikasi"
                        ? "bg-emerald-100 text-emerald-700"
                        : status === "on_chain"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                >
                    {status.toUpperCase()}
                </span>
            </header>

            {/* Card on-chain proof */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">
                    Bukti Pencatatan On-Chain
                </h2>

                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                    <div>
                        <dt className="text-slate-500">Hash Berkas (SHA-256)</dt>
                        <dd className="font-mono break-all bg-slate-50 px-2 py-1 rounded mt-1">
                            {hash_berkas}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-slate-500">Jaringan</dt>
                        <dd className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-800 text-[11px]">
                                {jaringan_ket ?? "-"}
                            </span>
                        </dd>
                    </div>

                    <div>
                        <dt className="text-slate-500">Tx Hash</dt>
                        <dd className="font-mono break-all bg-slate-50 px-2 py-1 rounded mt-1">
                            {tx_hash ?? "-"}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-slate-500">Alamat Kontrak</dt>
                        <dd className="font-mono break-all bg-slate-50 px-2 py-1 rounded mt-1">
                            {alamat_kontrak ?? "-"}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-slate-500">Nomor Blok</dt>
                        <dd className="mt-1 font-mono">
                            {block_number ?? <span className="text-slate-400">-</span>}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-slate-500">Waktu Blok (UTC)</dt>
                        <dd className="mt-1 text-xs">
                            {waktu_blok
                                ? new Date(waktu_blok).toLocaleString()
                                : <span className="text-slate-400">-</span>}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-slate-500">Terakhir Sinkron</dt>
                        <dd className="mt-1 text-xs">
                            {new Date(updated_at).toLocaleString()}
                        </dd>
                    </div>
                </dl>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 mt-2">
                    {etherscan_url && (
                        <a
                            href={etherscan_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            Lihat transaksi di Etherscan
                        </a>
                    )}

                    <p className="text-[11px] text-slate-500">
                        Data di atas dapat digunakan sebagai bukti teknis bahwa suatu berkas
                        dengan hash tersebut telah tercatat di blockchain publik.
                    </p>
                </div>
            </section>
        </div>
    );
}
