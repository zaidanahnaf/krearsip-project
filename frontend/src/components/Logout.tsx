import { logout } from "../auth/siweAuth";

export function Logout() {

    const handleLogout = async () => {
        try {
            logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <button
            className="group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-bold text-white rounded-lg shadow-2xl bg-gradient-to-br
                from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
            onClick={handleLogout}
        >Logout</button>
    );
}