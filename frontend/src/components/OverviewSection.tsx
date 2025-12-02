import type { Work } from "../api/types";

interface OverviewSectionProps {
    works: Work[];
}

export function OverviewSection({ works }: OverviewSectionProps) {
    const total = works.length;
    const terverifikasi = works.filter(w => w.status === "terverifikasi").length;
    const belumVerifikasi = works.filter(w => w.status !== "terverifikasi").length;

    return (
        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-900">Ringkasan Karya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-indigo-50">
                    <p className="text-sm text-slate-600">Total Karya</p>
                    <p className="text-2xl font-bold text-indigo-700">{total}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50">
                    <p className="text-sm text-slate-600">Terverifikasi</p>
                    <p className="text-2xl font-bold text-emerald-700">{terverifikasi}</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50">
                    <p className="text-sm text-slate-600">Belum Diverifikasi</p>
                    <p className="text-2xl font-bold text-amber-700">{belumVerifikasi}</p>
                </div>
            </div>
        </section>
    );
}
