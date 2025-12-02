import {
    createContext,
    use,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { authService } from "../api/services";
import type { UserProfile, AuthContextValue } from "../api/types";

const TOKEN_STORAGE_KEY = "TOKEN_KEY";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (stored) {
            setToken(stored);
        }
        setInitialized(true);
    }, []);

    useEffect(() => {
        (async () => {
            if (!token) {
                setUser(null);
                return;
            }
            try {
                const me = await authService.getProfile();
                setUser(me);
                console.log(me);
            } catch {
                // token invalid/expired
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                localStorage.removeItem("WALLET_KEY");
                setToken(null);
                setUser(null);
            }
        })();
    }, [token]);

    const login = (newToken: string) => {
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem("WALLET_KEY");
        setToken(null);
    };

    const value: AuthContextValue = {
        token,
        pengguna: user,
        isAuthenticated: !!token,
        isChecking: !initialized,
        isPencipta: user?.peran === "pencipta",
        isVerifikator: user?.peran === "verifikator",
        isAdmin: user?.peran === "admin",
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuthContext must be used within AuthProvider");
    }
    return ctx;
}

