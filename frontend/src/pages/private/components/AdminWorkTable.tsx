import type { AdminWorkItem } from "../../../api/types";
import { AdminWorkRow } from "./AdminWorkRow";

interface Props {
    works: AdminWorkItem[];
    emptyMessage: string;
    title: string;
    actionBusyId: string | null;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string) => Promise<void>;
    onDeploy: (id: string) => Promise<void>;
    onSync: (w: AdminWorkItem) => Promise<void>;
    onVerify: (id: string) => Promise<void>;
}

export function AdminWorkTable({
    works,
    emptyMessage,
    title,
    actionBusyId,
    onApprove,
    onReject,
    onDeploy,
    onSync,
    onVerify,
}: Props) {
    return (
        <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                <div className="text-xs text-slate-500">{works.length} item</div>
            </div>

            {works.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">{emptyMessage}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 text-xs text-slate-600 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Karya</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">On-chain</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {works.map((w) => (
                                <AdminWorkRow
                                    key={w.id}
                                    w={w}
                                    actionBusyId={actionBusyId}
                                    onApprove={onApprove}
                                    onReject={onReject}
                                    onDeploy={onDeploy}
                                    onSync={onSync}
                                    onVerify={onVerify}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
