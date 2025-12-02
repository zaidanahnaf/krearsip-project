import { api, getAuthToken } from "./client";
import type {
    UserProfile,
    Work,
    AdminWork,
    PublicWorkListResponse,
    AdminWorksListResponse,
    CreatorWorkPayload,
    RejectBody,
} from "./types";

function requireToken(): string {
    const token = getAuthToken();
    if (!token) {
        throw new Error("Token not found");
    }
    return token;
}

/* ================== PUBLIC & AUTH SERVICE ================== */

export const publicService = {
    async getPublicWorks(query?: string): Promise<Work[]> {
        const searchParam =
            query && query.trim() !== ""
                ? `?q=${encodeURIComponent(query)}`
                : "";
        // backend kemungkinan besar return { items, total, ... }
        const data = await api.get<PublicWorkListResponse>(
            `/public/works${searchParam}`
        );
        return data.items;
    },
};

export const authService = {
    async getProfile(): Promise<UserProfile> {
        const token = getAuthToken();
        if (!token) throw new Error("Token not found");

        // pakai api.auth.get supaya header Authorization kepasang
        return api.auth.get<UserProfile>("/auth/me", token);
    },

    logout() {
        localStorage.removeItem("TOKEN_KEY");
        localStorage.removeItem("WALLET_KEY");
    },
};

export const workService = {
    async getWorks(): Promise<Work[]> {
        const token = getAuthToken();
        if (!token) throw new Error("Token not found");

        const res = await api.auth.get<PublicWorkListResponse>("/works", token);
        return res.items;
    },

    async createWork(payload: CreatorWorkPayload): Promise<Work> {
        const token = getAuthToken();
        if (!token) throw new Error("Token not found");

        return api.auth.post<Work>("/works", token, payload);
    },
};

/* ================== ADMIN WORK SERVICE ================== */

export const adminWorkService = {
    async listAdminWorks(params?: {
        status?: string;
        queue?: "draft" | "onchain" | "verified";
        limit?: number;
        offset?: number;
    }): Promise<AdminWorksListResponse> {
        const token = requireToken();

        const queryString = new URLSearchParams(
            Object.entries(params || {})
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
        ).toString();
        const url = `/admin/works${queryString ? `?${queryString}` : ''}`;
        const res = await api.auth.get<AdminWorksListResponse>(url, token);
        return res;
    },

    // helper buat queue2:
    async getDraftQueue() {
        return this.listAdminWorks({ queue: 'draft', limit: 50, offset: 0 });
    },

    async getOnchainQueue() {
        return this.listAdminWorks({ queue: 'onchain', limit: 50, offset: 0 });
    },

    async getVerifiedQueue() {
        return this.listAdminWorks({ queue: 'verified', limit: 50, offset: 0 });
    },

    /**
     * Approve draft: draft -> draft + status_onchain=menunggu
     * POST /admin/works/{karya_id}/approve
     */
    async approveWork(karyaId: string | number): Promise<AdminWork> {
        const token = requireToken();
        return api.auth.post<AdminWork>(
            `/admin/works/${karyaId}/approve`,
            token,
            {}
        );
    },

    /**
     * Reject draft: draft -> tetap draft, tapi semantik "ditolak"
     * POST /admin/works/{karya_id}/reject
     */
    async rejectWork(
        karyaId: string | number,
        body?: RejectBody
    ): Promise<AdminWork> {
        const token = requireToken();
        return api.auth.post<AdminWork>(
            `/admin/works/${karyaId}/reject`,
            token,
            body ?? {}
        );
    },

    /**
     * Trigger blockchain deployment
     * POST /admin/works/{karya_id}/deploy
     */
    async deployWork(karyaId: string | number): Promise<AdminWork> {
        const token = requireToken();
        return api.auth.post<AdminWork>(
            `/admin/works/${karyaId}/deploy`,
            token,
            {}
        );
    },

    /**
     * Sync 1 transaksi dari Sepolia ke DB berdasarkan tx_hash
     * POST /admin/sync-tx/{tx_hash}
     */
    async syncTx(txHash: string): Promise<any> {
        const token = requireToken();
        const clean = txHash.trim();
        return api.auth.post(
            `/admin/sync-tx/${clean}`,
            token,
            {}
        );
    },

    /**
     * Verifikasi karya: on_chain + berhasil -> terverifikasi
     * POST /admin/works/{karya_id}/verify
     */
    async verifyWork(karyaId: string | number): Promise<AdminWork> {
        const token = requireToken();
        return api.auth.post<AdminWork>(
            `/admin/works/${karyaId}/verify`,
            token,
            {}
        );
    },

    /**
     * (Opsional) Debug RPC yang dipakai backend
     * GET /admin/debug/rpc
     */
    async getRpcInfo(): Promise<{ sepolia_rpc: string }> {
        const token = requireToken();
        return api.auth.get<{ sepolia_rpc: string }>(
            "/admin/debug/rpc",
            token
        );
    },
};