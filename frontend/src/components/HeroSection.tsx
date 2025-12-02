import { Link } from "react-router-dom";

interface HeroSectionProps {
    onExploreClick?: () => void;
}

export function HeroSection({ onExploreClick }: HeroSectionProps) {
    return (
        <section className="text-center py-16 md:py-24 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-indigo-900">On-Chain Verified</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                    Bukti otentik untuk setiap{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                        karya digital
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Krearsip adalah platform verifikasi dan arsip karya di blockchain.
                    Lindungi kreativitas Anda dengan bukti kepemilikan yang transparan dan permanen.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {/* TODO: Update route sesuai dengan routing yang sudah didefinisikan */}
                    <Link
                        to="../login"
                        className="px-8 py-3 rounded-xl text-base font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        Mulai sebagai Kreator
                    </Link>
                    <button
                        onClick={onExploreClick}
                        className="px-8 py-3 rounded-xl text-base font-semibold bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                        Jelajahi Karya Terverifikasi
                    </button>
                </div>

                {/* Visual Element - Mock Verification Card */}
                <div className="mt-16 max-w-md mx-auto">
                    <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-6 border border-slate-200 shadow-xl">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-xs font-medium text-slate-500 mb-1">Transaction Hash</p>
                                <p className="text-sm font-mono text-slate-700 break-all">0x7f9fade...c8a3b</p>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 text-left">
                            <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-medium">
                                Terverifikasi di Blockchain
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}