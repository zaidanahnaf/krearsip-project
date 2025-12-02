export const shortenHash = (hash: string, startLen = 6, endLen = 4): string => {
    if (!hash || hash.length <= startLen + endLen) return hash;
    return `${hash.slice(0, startLen)}...${hash.slice(-endLen)}`;
};

export const formatDate = (isoDate: string): string => {
    return new Date(isoDate).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getWorkStats = (works: { status: string }[]) => {
    const total = works.length;
    const confirmed = works.filter(w => w.status === 'TERVERIFIKASI').length;
    const pending = works.filter(w => w.status === 'TENKONFIRMASI').length;

    return { total, confirmed, pending };
};

export async function hashFileSHA256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}