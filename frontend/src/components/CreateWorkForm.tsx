import React, { useState } from "react";
import type { Work } from "../api/types";
import { workService } from "../api/services";
import { hashFileSHA256 } from "../utils/helpers";

interface CreateWorkFormProps {
    onWorkCreated: (newWork: Work) => void;
}

export function CreateWorkForm({ onWorkCreated }: CreateWorkFormProps) {
    const [judul, setJudul] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!judul || !file) {
            setError("Judul dan file wajib diisi.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const hashHex = await hashFileSHA256(file);
            const payload = { judul: judul.trim(), hash_berkas: hashHex };
            const newWork = await workService.createWork(payload);
            onWorkCreated(newWork);

            setJudul("");
            setFile(null);
        } catch (err: any) {
            setError(err?.message || "Gagal membuat karya.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5"
        >
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900">Daftarkan Karya</h2>
                <p className="text-sm text-slate-600 mt-1">
                    Upload karya dan sistem akan membuat hash sebagai bukti otentik blockchain.
                </p>
            </div>

            {/* Pesan Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Judul */}
            <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                    Judul Karya
                </label>
                <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Contoh: Poster Sinar Kota 2025"
                />
            </div>

            {/* File */}
            <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                    File Karya
                </label>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-between hover:border-indigo-400 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-slate-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4m0 0l4 4m-4-4v12"
                                />
                            </svg>
                        </div>

                        <div className="flex flex-col">
                            {file ? (
                                <>
                                    <span className="text-sm font-medium text-slate-900 truncate max-w-[220px]">
                                        {file.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </>
                            ) : (
                                <span className="text-sm text-slate-600">
                                    Pilih file untuk dihitung hash-nya
                                </span>
                            )}
                        </div>
                    </div>

                    <label className="cursor-pointer inline-flex items-center px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
                        {file ? "Ganti" : "Pilih"}
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            disabled={isSubmitting}
                        />
                    </label>
                </div>
            </div>

            {/* Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors flex justify-center items-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <span className="h-4 w-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                        Mendaftarkan...
                    </>
                ) : (
                    "Daftarkan Karya"
                )}
            </button>
        </form>
    );
}
