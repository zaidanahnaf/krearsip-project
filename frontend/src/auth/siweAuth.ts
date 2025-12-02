import { api, ApiError } from '../api/client';
import type { NonceResponse, AuthResponse, NonceRequest, SiweAuthRequest } from '../api/types';

declare global {
    interface Window {
        ethereum?: any;
    }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SIWE_CONFIG = {
    domain: window.location.host || 'localhost',
    uri: window.location.origin || 'http://localhost:5173',
    chainId: 11155111, // Sepolia testnet - sesuaikan dengan backend
    version: '1',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface LoginResult {
    token: string;
    wallet: string;
}

/**
 * Custom error class untuk SIWE authentication
 */
export class SiweError extends Error {
    constructor(
        message: string,
        public code?: string | number,
        public originalError?: any
    ) {
        super(message);
        this.name = 'SiweError';
    }
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

const ERROR_MESSAGES = {
    METAMASK_NOT_FOUND: 'Metamask tidak terdeteksi. Silakan instal Metamask terlebih dahulu.',
    NO_ACCOUNTS: 'Tidak ada akun wallet yang dipilih',
    USER_REJECTED_CONNECTION: 'Anda menolak koneksi ke wallet',
    USER_REJECTED_SIGNATURE: 'Anda menolak untuk menandatangani pesan',
    NO_NONCE: 'Nonce tidak diterima dari server',
    NO_SIGNATURE: 'Signature tidak diterima dari Metamask',
    NO_TOKEN: 'Token tidak diterima dari server',
    NONCE_REQUEST_FAILED: 'Gagal mendapatkan nonce dari server',
    SIGNATURE_FAILED: 'Gagal menandatangani pesan',
    AUTH_FAILED: 'Gagal autentikasi ke server',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build SIWE message sesuai EIP-4361 standard
 * @see https://eips.ethereum.org/EIPS/eip-4361
 */
function buildSiweMessage(wallet: string, nonce: string): string {
    const issuedAt = new Date().toISOString();

    // Format sesuai EIP-4361
    return `${SIWE_CONFIG.domain} wants you to sign in with your Ethereum account:
${wallet}

Krearsip - Verifikasi kepemilikan wallet Anda untuk mengakses platform.

URI: ${SIWE_CONFIG.uri}
Version: ${SIWE_CONFIG.version}
Chain ID: ${SIWE_CONFIG.chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

/**
 * Check if Metamask is available in browser
 */
function checkMetamaskAvailability(): void {
    if (!window.ethereum) {
        throw new SiweError(
            ERROR_MESSAGES.METAMASK_NOT_FOUND,
            'METAMASK_NOT_FOUND'
        );
    }
}

/**
 * Request wallet accounts from Metamask
 * @throws {SiweError} If user rejects or no accounts available
 */
async function requestWalletAccounts(): Promise<string> {
    try {
        const accounts: string[] = await window.ethereum.request({
            method: 'eth_requestAccounts',
        });

        if (!accounts || accounts.length === 0) {
            throw new SiweError(
                ERROR_MESSAGES.NO_ACCOUNTS,
                'NO_ACCOUNTS'
            );
        }

        return accounts[0].toLowerCase(); // Normalize to lowercase
    } catch (error: any) {
        // Metamask error code 4001 = user rejected
        if (error.code === 4001) {
            throw new SiweError(
                ERROR_MESSAGES.USER_REJECTED_CONNECTION,
                'USER_REJECTED_CONNECTION',
                error
            );
        }

        // Re-throw if already SiweError
        if (error instanceof SiweError) {
            throw error;
        }

        // Wrap other errors
        throw new SiweError(
            error.message || 'Gagal mengakses wallet',
            'WALLET_ACCESS_FAILED',
            error
        );
    }
}

/**
 * Request nonce from backend
 * @throws {SiweError} If request fails or nonce not received
 */
async function requestNonce(wallet: string): Promise<string> {
    try {
        const requestBody: NonceRequest = {
            alamat_wallet: wallet,
        };

        const response = await api.post<NonceResponse>('/auth/nonce', requestBody);

        if (!response.nonce) {
            throw new SiweError(
                ERROR_MESSAGES.NO_NONCE,
                'NO_NONCE'
            );
        }

        return response.nonce;
    } catch (error: any) {
        // If ApiError, wrap with better message
        if (error instanceof ApiError) {
            throw new SiweError(
                `${ERROR_MESSAGES.NONCE_REQUEST_FAILED}: ${error.message}`,
                'NONCE_REQUEST_FAILED',
                error
            );
        }

        // If already SiweError, re-throw
        if (error instanceof SiweError) {
            throw error;
        }

        // Wrap other errors
        throw new SiweError(
            ERROR_MESSAGES.NONCE_REQUEST_FAILED,
            'NONCE_REQUEST_FAILED',
            error
        );
    }
}

/**
 * Sign message with Metamask using personal_sign
 * @throws {SiweError} If user rejects or signing fails
 */
async function signMessage(message: string, wallet: string): Promise<string> {
    try {
        const signature: string = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, wallet],
        });

        if (!signature) {
            throw new SiweError(
                ERROR_MESSAGES.NO_SIGNATURE,
                'NO_SIGNATURE'
            );
        }

        return signature;
    } catch (error: any) {
        // Metamask error code 4001 = user rejected
        if (error.code === 4001) {
            throw new SiweError(
                ERROR_MESSAGES.USER_REJECTED_SIGNATURE,
                'USER_REJECTED_SIGNATURE',
                error
            );
        }

        // If already SiweError, re-throw
        if (error instanceof SiweError) {
            throw error;
        }

        // Wrap other errors
        throw new SiweError(
            `${ERROR_MESSAGES.SIGNATURE_FAILED}: ${error.message}`,
            'SIGNATURE_FAILED',
            error
        );
    }
}

/**
 * Submit authentication request to backend
 * @throws {SiweError} If authentication fails
 */
async function submitAuthentication(
    message: string,
    signature: string
): Promise<string> {
    try {
        const requestBody: SiweAuthRequest = {
            message,
            signature,
        };

        const response = await api.post<AuthResponse>('/auth/siwe', requestBody);

        if (!response.access_token) {
            throw new SiweError(
                ERROR_MESSAGES.NO_TOKEN,
                'NO_TOKEN'
            );
        }

        return response.access_token;
    } catch (error: any) {
        // If ApiError, wrap with better message
        if (error instanceof ApiError) {
            // Handle specific HTTP errors
            if (error.status === 401) {
                throw new SiweError(
                    'Signature tidak valid. Silakan coba lagi.',
                    'INVALID_SIGNATURE',
                    error
                );
            }
            if (error.status === 403) {
                throw new SiweError(
                    'Akses ditolak. Wallet tidak terdaftar sebagai kreator.',
                    'ACCESS_DENIED',
                    error
                );
            }

            throw new SiweError(
                `${ERROR_MESSAGES.AUTH_FAILED}: ${error.message}`,
                'AUTH_FAILED',
                error
            );
        }

        // If already SiweError, re-throw
        if (error instanceof SiweError) {
            throw error;
        }

        // Wrap other errors
        throw new SiweError(
            ERROR_MESSAGES.AUTH_FAILED,
            'AUTH_FAILED',
            error
        );
    }
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Complete SIWE (Sign-In With Ethereum) login flow
 * 
 * @returns {Promise<LoginResult>} Object containing JWT token and wallet address
 * @throws {SiweError} On any authentication failure with specific error code
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await loginWithSiwe();
 *   localStorage.setItem('token', result.token);
 *   console.log('Logged in as:', result.wallet);
 * } catch (error) {
 *   if (error instanceof SiweError) {
 *     console.error(`Error [${error.code}]:`, error.message);
 *   }
 * }
 * ```
 */
export async function loginWithSiwe(): Promise<LoginResult> {
    // Step 1: Verify Metamask is available
    checkMetamaskAvailability();

    // Step 2: Request wallet access from user
    const wallet = await requestWalletAccounts();

    // Step 3: Request nonce from backend
    const nonce = await requestNonce(wallet);

    // Step 4: Build SIWE message according to EIP-4361
    const message = buildSiweMessage(wallet, nonce);

    // Step 5: Sign message with Metamask
    const signature = await signMessage(message, wallet);

    // Step 6: Submit to backend for verification
    const token = await submitAuthentication(message, signature);

    return { token, wallet };
}

// ============================================================================
// ADDITIONAL UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user is currently logged in
 */



export function isLoggedIn(): boolean {
    const token = localStorage.getItem('TOKEN_KEY');
    const wallet = localStorage.getItem('WALLET_KEY');
    return !!(token && wallet);
}
/**
 * Get current logged in wallet address
 */
export function getCurrentWallet(): string | null {
    return localStorage.getItem('WALLET_KEY');
}

/**
 * Logout - clear stored credentials
 */

export function logout(): void {
    localStorage.removeItem('TOKEN_KEY');
    localStorage.removeItem('WALLET_KEY');
}

/**
 * Verify if Metamask is connected to correct network
 */
export async function verifyNetwork(): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
        const chainId = await window.ethereum.request({
            method: 'eth_chainId'
        });

        const currentChainId = parseInt(chainId, 16);
        return currentChainId === SIWE_CONFIG.chainId;
    } catch {
        return false;
    }
}

/**
 * Request network switch to correct chain
 */
export async function switchToCorrectNetwork(): Promise<void> {
    if (!window.ethereum) {
        throw new SiweError(
            ERROR_MESSAGES.METAMASK_NOT_FOUND,
            'METAMASK_NOT_FOUND'
        );
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${SIWE_CONFIG.chainId.toString(16)}` }],
        });
    } catch (error: any) {
        if (error.code === 4001) {
            throw new SiweError(
                'Anda menolak untuk mengganti network',
                'NETWORK_SWITCH_REJECTED',
                error
            );
        }
        throw new SiweError(
            'Gagal mengganti network',
            'NETWORK_SWITCH_FAILED',
            error
        );
    }
}