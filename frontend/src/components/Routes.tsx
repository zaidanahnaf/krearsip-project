import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { JSX } from "react";

export function RequireAuth({
    children,
    allow,
}: {
    children: JSX.Element;
    allow?: Array<"pencipta" | "verifikator" | "admin">;
}) {
    const { isAuthenticated, pengguna, isChecking } = useAuth();

    if (isChecking)
        return <p className="text-sm text-gray-500">Memeriksa sesi login...</p>;

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (allow && pengguna && !allow.includes(pengguna.peran))
        return <Navigate to="/forbidden" replace />;

    return children;
}


export function GuestRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isChecking } = useAuth();

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-sm text-gray-500">Memeriksa sesi login...</p>
            </div>
        );
    }

    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}
