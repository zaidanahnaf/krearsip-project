import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200"
                : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
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
                        <div className="text-xl font-semibold text-slate-900">
                            <span className="text-indigo-600">KREA</span>
                            <span className="text-gray-800">rsip</span>
                        </div>
                    </div>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => scrollToSection("features")}
                            className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                            Fitur
                        </button>
                        <button
                            onClick={() => scrollToSection("works-preview")}
                            className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                            Galeri
                        </button>
                        <Link
                            to="/about"
                            className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                            Tentang
                        </Link>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-3">
                        {/* TODO: Update routes sesuai dengan routing app */}
                        <Link
                            to="/login"
                            className="hidden sm:block text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                            Masuk
                        </Link>
                        <a
                            href="https://support.metamask.io/start/getting-started-with-metamask"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                            Daftar
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}