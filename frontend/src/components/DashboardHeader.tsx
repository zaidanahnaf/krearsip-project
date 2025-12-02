interface Props {
    walletAddress: string | null;
    onLogout: () => void;
}

export function DashboardHeader({ walletAddress, onLogout }: Props) {
    return (
        <header className="bg-white shadow-sm border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                    <div className="text-xl text-slate-900">
                        <span className="text-indigo-600">KREA</span>
                        <span className="text-gray-800 font-semibold">rsip</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {walletAddress && (
                        <div className="text-sm text-slate-600">
                            <span className="font-medium text-slate-900">Wallet:</span>{" "}
                            <span className="font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                        </div>
                    )}

                    <button
                        onClick={onLogout}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
