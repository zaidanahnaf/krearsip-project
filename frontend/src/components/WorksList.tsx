import type { Work, WorkStatus } from "../api/types";

interface WorksListProps {
    works: Work[];
    isLoading: boolean;
    error: string | null;
}

function getStatusBadgeClass(status: WorkStatus): string {
    switch (status) {
        case "draft":
            return "bg-amber-100 text-amber-700 border border-amber-200";
        case "terverifikasi":
            return "bg-indigo-100 text-indigo-700 border border-indigo-200";
        case "on_chain":
            return "bg-emerald-100 text-emerald-700 border border-emerald-200";
        default:
            return "bg-slate-100 text-slate-700 border border-slate-200";
    }
}

export function WorksList({ works, isLoading, error }: WorksListProps) {
    if (isLoading) {
        return (
            <p className="text-slate-500 text-sm animate-pulse">
                Memuat daftar karya...
            </p>
        );
    }

    if (error) {
        return <p className="text-red-600 text-sm">Terjadi kesalahan: {error}</p>;
    }

    if (works.length === 0) {
        return (
            <p className="text-slate-500 text-sm">
                Belum ada karya yang terdaftar.
            </p>
        );
    }

    return (
        <ul className="space-y-4">
            {works.map((work) => (
                <li
                    key={work.id}
                    className="
                        bg-white/80 backdrop-blur 
                        border border-slate-200 rounded-xl 
                        p-4 shadow-sm 
                        flex justify-between items-center gap-4
                        hover:shadow-md hover:border-indigo-300 
                        transition-all duration-200
                    "
                >
                    {/* Left section */}
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold text-slate-900 text-[15px]">
                            {work.judul}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadgeClass(
                                    work.status
                                )}`}
                            >
                                {work.status.toUpperCase()}
                            </span>

                            <span className="text-slate-400">•</span>

                            <span>
                                Update:{" "}
                                {new Date(work.updated_at).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Right section — link */}
                    <a
                        href={work.etherscan_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs font-medium rounded-lg px-3 py-1.5 transition-all
                            ${work.etherscan_url
                                ? "text-indigo-700 hover:tx-indigo-100 hover:shadow-sm"
                                : "text-slate-400 cursor-not-allowed"
                            }
                        `}
                    >
                        {work.etherscan_url
                            ? "Lihat di Etherscan"
                            : "Tidak ada link"}
                    </a>
                </li>
            ))}
        </ul>
    );
}
