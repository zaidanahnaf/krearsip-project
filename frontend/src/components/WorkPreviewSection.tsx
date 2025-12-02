import { Link } from "react-router-dom";
import type { WorksPreviewSectionProps, Work } from "../api/types";

export function WorksPreviewSection({
    data,
    loading,
    error,
    query,
    setQuery,
    isSearching,
    handleSearch
}: WorksPreviewSectionProps) {
    // Limit to 6 items for preview
    // TODO: Could be changed to backend query param ?limit=6 in the future
    const limitedItems = data?.items.slice(0, 6) ?? [];

    return (
        <section id="works-preview" className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Karya Terverifikasi
                    </h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Jelajahi karya-karya yang telah diverifikasi dan tercatat di blockchain
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto flex gap-3">
                        <input
                            type="text"
                            placeholder="Cari judul karya..."
                            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSearch(e as any);
                                }
                            }}
                        />
                        <button
                            onClick={(e) => handleSearch(e as any)}
                            disabled={isSearching}
                            className="px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSearching ? "Mencari..." : "Cari"}
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && !data && (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-600 mt-4">Memuat karya terverifikasi...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-red-700">
                            Terjadi kesalahan: {error}
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && data && limitedItems.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-500">
                            Belum ada karya yang bisa ditampilkan di galeri publik saat ini.
                        </p>
                    </div>
                )}

                {/* Works Grid */}
                {!loading && limitedItems.length > 0 && (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {limitedItems.map((w: Work) => (
                                <article
                                    key={w.id}
                                    className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all overflow-hidden group"
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <h3 className="font-semibold text-base text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                {w.judul}
                                            </h3>
                                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap">
                                                {w.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 mb-4">
                                            <p className="text-xs text-slate-500">
                                                Jaringan:{" "}
                                                <span className="font-medium text-slate-700">
                                                    {w.jaringan_ket ?? "-"}
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Update terakhir:{" "}
                                                <span className="font-medium text-slate-700">
                                                    {new Date(w.updated_at).toLocaleDateString("id-ID")}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                                            {w.etherscan_url ? (
                                                <a
                                                    href={w.etherscan_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                                                >
                                                    Lihat di Etherscan →
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">
                                                    Tidak ada link Etherscan
                                                </span>
                                            )}

                                            <Link
                                                to={`/work/${w.id}`}
                                                className="ml-auto text-xs text-slate-700 hover:text-indigo-600 font-semibold transition-colors"
                                            >
                                                Detail →
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* View All Link */}
                        {data && data.items.length > 6 && (
                            <div className="text-center">
                                {/* TODO: Update route to /gallery when implemented */}
                                <Link
                                    to="/gallery"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                >
                                    Lihat Semua Karya
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
