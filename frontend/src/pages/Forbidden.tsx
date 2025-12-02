import { Footer } from "../components/Footer";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function Forbidden403() {
    return (
        <div className="min-h-screen bg-white flex flex-col">

            <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-lg"
                >
                    <div className="flex justify-center mb-6">
                        <AlertTriangle className="w-20 h-20 text-yellow-600" />
                    </div>

                    <h1 className="text-5xl font-bold text-gray-900 mb-4">403</h1>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">Access Forbidden</h2>
                    <p className="text-gray-600 mb-8">
                        Kamu tidak memiliki izin untuk mengakses halaman ini. Jika kamu merasa ini
                        adalah kesalahan, silakan hubungi administrator.
                    </p>

                    <a
                        href="/"
                        className="inline-block rounded-2xl px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-shadow shadow-lg"
                    >
                        Kembali ke Beranda
                    </a>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
