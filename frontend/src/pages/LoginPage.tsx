import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { loginWithSiwe, SiweError, type LoginResult } from '../auth/siweAuth';
import { LoginHeader } from '../components/LoginHeader';
import { formatAddress } from '../utils/formatters';
import LeftPanel from '../assets/left-panel-illustration.svg'
// import LeftPanelBG from '../assets/left-panel-bg.svg'
// import Text1 from '../assets/left-panel-text1.svg';
// import Text2 from '../assets/left-panel-text2.svg';
// import KrearsipLogo from '../assets/krearsip-logo.svg'
import MetamaskLogo from '../assets/metamask-logo.svg';
import PhantomLogo from '../assets/phantom-logo.svg';
import TrustWalletLogo from '../assets/trust-wallet-logo.svg';
import ExodusLogo from '../assets/exodus-logo.svg';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../api/services';


export function CreatorLoginPage() {
    // Navigation hook
    const navigate = useNavigate();
    const { login } = useAuth();

    // State management
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [loginSuccess, setLoginSuccess] = useState(false);

    const redirectByRole = (role: "pencipta" | "verifikator" | "admin") => {
        switch (role) {
            case "pencipta":
                navigate('/dashboard', { replace: true });
                break;
            case "verifikator":
                navigate('/verifikator', { replace: true });
                break;
            case "admin":
                navigate('/admin', { replace: true });
                break;
            default:
                navigate('/', { replace: true });
        }
    };

    /**
     * Handler untuk koneksi wallet dan login
     */
    const handleConnect = async () => {
        // Reset states
        setError(null);
        setIsConnecting(true);
        setLoginSuccess(false);

        try {
            // Panggil SIWE login flow
            const result: LoginResult = await loginWithSiwe();

            login(result.token);

            // Store credentials di localStorage
            localStorage.setItem('WALLET_KEY', result.wallet);
            setWalletAddress(result.wallet);

            const me = await authService.getProfile();

            setLoginSuccess(true);

            // Redirect ke dashboard setelah 2 detik
            setTimeout(() => {
                redirectByRole(me.peran);
            }, 2000);

        } catch (err: any) {
            // Handle SiweError dengan error codes
            if (err instanceof SiweError) {
                console.error(`[SIWE Error ${err.code}]:`, err.message);

                // Custom error messages untuk user
                switch (err.code) {
                    case 'METAMASK_NOT_FOUND':
                        setError('Metamask tidak terdeteksi. Silakan instal Metamask extension terlebih dahulu.');
                        break;
                    case 'USER_REJECTED_CONNECTION':
                        setError('Anda membatalkan koneksi ke wallet. Silakan coba lagi.');
                        break;
                    case 'USER_REJECTED_SIGNATURE':
                        setError('Anda membatalkan penandatanganan pesan. Login dibatalkan.');
                        break;
                    case 'INVALID_SIGNATURE':
                        setError('Signature tidak valid. Silakan coba lagi.');
                        break;
                    case 'ACCESS_DENIED':
                        setError('Wallet Anda tidak terdaftar sebagai kreator. Silakan daftar terlebih dahulu.');
                        break;
                    default:
                        setError(err.message);
                }
            } else {
                // Generic error
                setError(err.message || 'Terjadi kesalahan saat login. Silakan coba lagi.');
            }

            setWalletAddress(null);
        } finally {
            setIsConnecting(false);
        }
    };

    /**
     * Handler untuk link ke halaman register
     */
    const handleRegisterClick = (e: React.MouseEvent) => {
        e.preventDefault();

        window.open(
            'https://support.metamask.io/start/getting-started-with-metamask',
            '_blank',
            'noopener,noreferrer'
        );
    };

    /**
     * Handler untuk link bantuan
     */
    const handleHelpClick = (e: React.MouseEvent) => {
        e.preventDefault();
        // Bisa redirect ke halaman help atau buka modal
        window.open('https://docs.krearsip.com/help', '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-violet-200">
            <div>
                {/* Header */}
                <LoginHeader />
            </div>
            <div className="flex items-center justify-center bg-white-shadow">
                <div className="relative rounded-[32px] border border-white/10 bg-white/200 shadow-2xl w-full max-w-6xl grid md:grid-cols-2 gap-6 items-center">

                    {/* Left Panel - Ilustrasi */}
                    <div>
                        <div>
                            <img
                                src={LeftPanel}
                                alt='LeftPanelIllustration'
                                className="rounded-3x1 p-12 items-center justify-center"
                            />
                            {/* <img
                                src={KrearsipLogo}
                                alt='KrearsipLogo'
                                className='h-40 w-40'
                            /> */}
                        </div>
                    </div>

                    {/* Right Panel - Login Form */}
                    <div className="rounded-3xl p-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="text-sm font-semibold mb-2">
                                <span className="text-indigo-600">KREA</span>
                                <span className="text-gray-800">rsip</span>
                            </div>
                            <h1 className="text-5xl font-bold text-gray-900 mb-3">
                                Selamat Datang!
                            </h1>
                            <p className="text-gray-600 p-2 bg-amber-100 rounded-2x1">
                                Masuk sebagai kreator dan verifikasi karya kamu di blockchain.
                            </p>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {loginSuccess && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-fadeIn">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-700">Login berhasil!</p>
                                    <p className="text-xs text-green-600 mt-1">
                                        Wallet: {walletAddress && formatAddress(walletAddress)}
                                    </p>
                                    <p className="text-xs text-green-500 mt-1">
                                        Mengarahkan ke dashboard...
                                    </p>
                                </div>
                            </div>
                        )}

                        {walletAddress && !loginSuccess && !error && (
                            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl animate-fadeIn">
                                <p className="text-sm text-indigo-700">
                                    Terhubung: <span className="font-mono font-medium">{formatAddress(walletAddress)}</span>
                                </p>
                                <p className="text-xs text-indigo-500 mt-1">
                                    Memverifikasi...
                                </p>
                            </div>
                        )}

                        {/* Wallet Connection Section */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">
                                Masuk & hubungkan ke dompet kripto Anda
                            </h2>

                            <div className="grid grid-cols-4 gap-4">
                                {/* Metamask Button - Active */}
                                <button
                                    onClick={handleConnect}
                                    disabled={isConnecting || loginSuccess}
                                    className="group relative p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                                    aria-label="Connect with Metamask"
                                >
                                    {isConnecting ? (
                                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                    ) : (
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-orange-200 transition-colors">
                                            <img
                                                src={MetamaskLogo}
                                                alt="Metamask Logo"
                                                className="w-8 h-8"
                                            />
                                        </div>
                                    )}
                                </button>

                                {/* Placeholder Wallets - Coming Soon */}
                                <button
                                    disabled
                                    className="p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl opacity-40 cursor-not-allowed flex flex-col items-center justify-center"
                                    title="Coming soon"
                                >
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
                                        <img
                                            src={PhantomLogo}
                                            alt="Phantom Logo"
                                            className="w-8 h-8"
                                        />
                                    </div>
                                </button>

                                <button
                                    disabled
                                    className="p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl opacity-40 cursor-not-allowed flex flex-col items-center justify-center"
                                    title="Coming soon"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                                        <img
                                            src={ExodusLogo}
                                            alt="Exodus Logo"
                                            className="w-8 h-8"
                                        />
                                    </div>
                                </button>

                                <button
                                    disabled
                                    className="p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl opacity-40 cursor-not-allowed flex flex-col items-center justify-center"
                                    title="Coming soon"
                                >
                                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-2">
                                        <img
                                            src={TrustWalletLogo}
                                            alt="Trust Wallet Logo"
                                            className="w-8 h-8"
                                        />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Footer Links */}
                        <div className="text-sm text-gray-600 flex items-center justify-between pt-6 border-t border-gray-200">
                            <div>
                                Belum memiliki akun?{' '}
                                <a
                                    href="https://support.metamask.io/start/getting-started-with-metamask"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleRegisterClick}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                                >
                                    Daftar disini
                                </a>
                            </div>
                            <a
                                href="/help"
                                onClick={handleHelpClick}
                                className="text-gray-500 hover:text-gray-700 hover:underline"
                            >
                                Bantuan
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};