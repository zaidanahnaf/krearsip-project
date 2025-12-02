import { useEffect, useState } from "react";
import React from "react";
import { api } from "../src/api/client";
import type { PublicWorkListResponse } from "../src/api/types";
import { Navbar } from "../src/components/Navbar";
import { HeroSection } from "../src/components/HeroSection";
import { FeatureSection } from "../src/components/FeatureSection";
import { WorksPreviewSection } from "../src/components/WorkPreviewSection";
import { Footer } from "../src/components/Footer";

export function LandingPage() {
    const [data, setData] = useState<PublicWorkListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    async function loadWorks(q?: string) {
        setLoading(true);
        setError(null);

        try {
            const searchParam = q && q.trim() !== "" ? `?q=${encodeURIComponent(q)}` : "";
            const res = await api.get<PublicWorkListResponse>(`/public/works${searchParam}`);
            setData(res);
        } catch (e: any) {
            setError(e?.message ?? "Gagal memuat data");
        } finally {
            setLoading(false);
        }
    }

    // Load works on mount
    useEffect(() => {
        loadWorks();
    }, []);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setIsSearching(true);
        try {
            await loadWorks(query);
        } finally {
            setIsSearching(false);
        }
    }

    const scrollToWorks = () => {
        const element = document.getElementById("works-preview");
        element?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <HeroSection onExploreClick={scrollToWorks} />
                <FeatureSection />
                <WorksPreviewSection
                    data={data}
                    loading={loading}
                    error={error}
                    query={query}
                    setQuery={setQuery}
                    isSearching={isSearching}
                    handleSearch={handleSearch}
                />
            </div>
            <Footer />
        </div>
    );
}
