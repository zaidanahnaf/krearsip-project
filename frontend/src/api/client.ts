import type { ApiErrorResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public path: string,
        public details?: ApiErrorResponse,
        cause?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
        if (cause) this.cause = cause;
    }
}

/**
 * Handle API response dengan error handling yang lebih baik
 */
async function handleResponse<T>(res: Response, path: string): Promise<T> {
    if (!res.ok) {
        let errorDetails: ApiErrorResponse | undefined;
        let errorMessage = res.statusText;

        try {
            errorDetails = await res.json();
            if (Array.isArray(errorDetails?.detail)) {
                errorMessage = errorDetails.detail.map(d => d.msg || d).join(', ');
            } else {
                errorMessage = errorDetails?.detail || errorDetails?.message || errorMessage;
            }
        } catch {
            const text = await res.text();
            if (text) errorMessage = text;
        }

        throw new ApiError(`API error ${res.status} on ${path}: ${errorMessage}`, res.status, path, errorDetails);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) return {} as T;

    return res.json();
}

/**
 * Helper untuk authenticated requests dengan auto token retrieval
 */
async function request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    { body, token, ...options }: { body?: any; token?: string } & RequestInit = {}
): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options?.headers || {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        ...options,
    });
    return handleResponse<T>(res, path);
}

export const api = {
    get: <T>(path: string, options?: RequestInit) => request<T>('GET', path, options),
    post: <T>(path: string, body: any, options?: RequestInit) => request<T>('POST', path, { ...options, body }),
    put: <T>(path: string, body: any, options?: RequestInit) => request<T>('PUT', path, { ...options, body }),
    delete: <T>(path: string, options?: RequestInit) => request<T>('DELETE', path, options),

    auth: {
        get: <T>(path: string, token: string, options?: RequestInit) => request<T>('GET', path, { ...options, token }),
        post: <T>(path: string, token: string, body: any, options?: RequestInit) =>
            request<T>('POST', path, { ...options, token, body }),
        put: <T>(path: string, token: string, body: any, options?: RequestInit) =>
            request<T>('PUT', path, { ...options, token, body }),
        delete: <T>(path: string, token: string, options?: RequestInit) =>
            request<T>('DELETE', path, { ...options, token }),
    },
};

export function getAuthToken(): string | null {
    return localStorage.getItem("TOKEN_KEY");
}

// ============================================================================
// Usage Examples (untuk dokumentasi)
// ============================================================================

/*
// Basic usage
const works = await apiGet<PublicWorkListResponse>('/works');

// With auth
const token = localStorage.getItem('TOKEN_KEY');
const myWorks = await apiGetAuth<CreatorWork[]>('/creator/works', token);

// Or using auto token retrieval
const myWorks = await apiAuthRequest<CreatorWork[]>('GET', '/creator/works');

// POST with type safety
const nonce = await apiPost<NonceResponse>('/auth/nonce', {
    alamat_wallet: '0x...'
});

// Error handling
try {
    await apiPost('/auth/siwe', { message, signature });
} catch (error) {
    if (error instanceof ApiError) {
        console.error(`Error ${error.status}: ${error.message}`);
        console.error('Details:', error.details);
    }
}
*/