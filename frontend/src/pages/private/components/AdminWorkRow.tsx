import type { AdminWorkItem } from "../../../api/types";
import { StatusBadge } from "./StatusBadge";
import { OnchainBadge } from "./OnchainBadge";
import {
    canApprove,
    canReject,
    canDeploy,
    canSync,
    canVerify,
} from "../utils/rules";

interface Props {
    w: AdminWorkItem;
    actionBusyId: string | null;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string) => Promise<void>;
    onDeploy: (id: string) => Promise<void>;
    onSync: (w: AdminWorkItem) => Promise<void>;
    onVerify: (id: string) => Promise<void>;
}

export function AdminWorkRow({ w, actionBusyId, onApprove, onReject, onDeploy, onSync, onVerify }: Props) {
    const isBusy = actionBusyId === w.id;

    const approveEnabled = canApprove(w.status, w.status_onchain);
    const rejectEnabled = canReject(w.status, w.status_onchain);
    const deployEnabled = canDeploy(w.status, w.status_onchain);
    const syncEnabled = canSync(w.status, w.status_onchain) && !!w.tx_hash;
    const verifyEnabled = canVerify(w.status, w.status_onchain);

    return (
        <tr className="hover:bg-slate-50 transition">
            <td className="px-4 py-3 align-top max-w-[380px]">
                <div className="font-medium text-slate-900 truncate">{w.judul}</div>
                <div className="text-xs text-slate-500 mt-1">
                    Kreator: {w.creator?.nama_tampil || w.creator?.alamat_wallet || "Tidak diketahui"}
                </div>
            </td>

            <td className="px-4 py-3 align-middle text-left">
                <StatusBadge status={w.status} />
            </td>

            <td className="px-4 py-3 align-middle text-left">
                <div className="flex flex-col gap-1">
                    <OnchainBadge status={w.status_onchain} />
                    {w.tx_hash && (
                        <div className="text-[11px] text-slate-500 break-words max-w-[260px]">
                            Tx: <span className="font-mono">{w.tx_hash}</span>
                        </div>
                    )}
                </div>
            </td>

            <td className="px-4 py-3 text-right align-middle space-x-2">
                <button
                    onClick={() => onApprove(w.id)}
                    disabled={!approveEnabled || isBusy}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition ${approveEnabled && !isBusy
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                >
                    {isBusy ? "Processing..." : "Approve"}
                </button>

                <button
                    onClick={() => onReject(w.id)}
                    disabled={!rejectEnabled || isBusy}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition ${rejectEnabled && !isBusy
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                >
                    {isBusy ? "Processing..." : "Reject"}
                </button>

                <button
                    onClick={() => onDeploy(w.id)}
                    disabled={!deployEnabled || isBusy}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition ${deployEnabled && !isBusy
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                >
                    {isBusy ? "Processing..." : "Deploy"}
                </button>

                <button
                    onClick={() => onSync(w)}
                    disabled={!syncEnabled || isBusy}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition ${syncEnabled && !isBusy
                        ? "bg-yellow-600 text-white hover:bg-yellow-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                >
                    {isBusy ? "Processing..." : "Sync"}
                </button>

                <button
                    onClick={() => onVerify(w.id)}
                    disabled={!verifyEnabled || isBusy}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition ${verifyEnabled && !isBusy
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                >
                    {isBusy ? "Processing..." : "Verify"}
                </button>
            </td>
        </tr>
    );
}
