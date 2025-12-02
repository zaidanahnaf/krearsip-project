export type WorkStatus = 'draft' | 'on_chain' | 'terverifikasi';

export type OnchainStatus =
    | 'tidak ada'
    | 'dalam antrian'
    | 'menunggu'
    | 'berhasil'
    | 'gagal';

export type Peran = "pencipta" | "verifikator" | "admin";

export interface AuthContextValue {
    token: string | null;
    pengguna: UserProfile | null;
    isAuthenticated: boolean;
    isChecking: boolean;
    isPencipta: boolean;
    isVerifikator: boolean;
    isAdmin: boolean;
    login: (token: string) => void;
    logout: () => void;
}


export interface Work {
    id: string;
    judul: string;
    status: WorkStatus;
    tx_hash: string | null;
    jaringan_ket: string | null;
    updated_at: string;
    etherscan_url?: string | null;
}

export interface AdminWorkCreator {
    id: string;
    nama_tampil?: string | null;
    alamat_wallet: string;
}

export interface AdminWorkVerifier {
    id: string;
    nama_tampil?: string | null;
}

export interface AdminWorkItem {
    id: string;
    judul: string;

    status: WorkStatus;
    status_onchain: OnchainStatus;

    jaringan_ket?: string | null;
    tx_hash?: string | null;
    block_number?: number | null;

    created_at: string;   // ISO
    updated_at: string;
    verified_at?: string | null;
    alasan_penolakan?: string | null;

    creator: AdminWorkCreator;
    verifier?: AdminWorkVerifier | null;
}

export interface AdminWorksListResponse {
    items: AdminWorkItem[];
    total: number;
    limit: number;
    offset: number;
}

export interface AdminWork {
    id: string;
    judul: string;
    status: "draft" | "on_chain" | "terverifikasi";
    status_onchain: "tidak ada" | "dalam antrian" | "menunggu" | "berhasil" | "gagal";
    tx_hash: string | null;
    jaringan_ket: string | null;
    block_number: number | null;
    updated_at: string; // ISO timestamp
    alamat_wallet: string;
    email: string | null;
    etherscan_url: string | null;

    // Kolom lain dari SELECT * / RETURNING * (approve/reject/deploy) bakal tetap ikut,
    // jadi kita kasih index signature supaya gak ribut kalau ada field tambahan.
    [key: string]: any;
}

// export interface AdminWorksListResponse {
//     items: AdminWork[];
//     total: number;
//     limit: number;
//     offset: number;
// }

export interface ListWorksParams {
    q?: string;
    status?: "draft" | "on_chain" | "terverifikasi";
    status_onchain?: "tidak ada" | "dalam antrian" | "menunggu" | "berhasil" | "gagal";
    queue?: "draft" | "onchain" | "verified";
    limit?: number;
    offset?: number;
}

// Body optional buat reject (kalau nanti lu tambahin alasan)
export interface RejectBody {
    reason?: string;
}


export interface UserProfile {
    id: string;
    wallet_address: string;
    name?: string;
    peran: Peran;
}


export interface PublicWorkListResponse {
    items: Work[];
    total: number;
    limit: number;
    offset: number;
}

export interface WorksPreviewSectionProps {
    data: PublicWorkListResponse | null;
    loading: boolean;
    error: string | null;
    query: string;
    setQuery: (q: string) => void;
    isSearching: boolean;
    handleSearch: (e: React.FormEvent) => Promise<void>;
}

export interface PublicWorkDetail {
    id: string;
    judul: string;
    hash_berkas: string;
    status: WorkStatus;
    tx_hash: string | null;
    alamat_kontrak: string | null;
    jaringan_ket: string | null;
    block_number: number | null;
    waktu_blok: string | null;
    updated_at: string;
    etherscan_url?: string | null;
}

export interface CreatorWorkPayload {
    id?: string;
    judul: string;
    hash_berkas: string;
    status?: WorkStatus;
    tx_hash?: string | null;
    jaringan_ket?: string | null;
    updated_at?: string;
    etherscan_url?: string | null;
}

export interface VerifierWorkRow {
    id: string;
    judul: string;
    status: WorkStatus;
    tx_hash: string | null;
    jaringan_ket: string;
    block_number: number | null;
    updated_at: string;
    alamat_wallet: string;
    email?: string | null;
    etherscan_url?: string | null;
}

export interface NonceResponse {
    nonce: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface NonceRequest {
    alamat_wallet: string;
}

export interface SiweAuthRequest {
    message: string;
    signature: string;
}

export interface ApiErrorResponse {
    detail?: string | string[] | Record<string, any>;
    message?: string;
    errors?: Record<string, string[]>;
}
