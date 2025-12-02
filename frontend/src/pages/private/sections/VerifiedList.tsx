import type { AdminWorkItem } from "../../../api/types";
import { AdminWorkTable } from "../components/AdminWorkTable";

interface Props {
    works: AdminWorkItem[];
    actionBusyId: string | null;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string) => Promise<void>;
    onDeploy: (id: string) => Promise<void>;
    onSync: (w: AdminWorkItem) => Promise<void>;
    onVerify: (id: string) => Promise<void>;
}

export function VerifiedList({ works, actionBusyId, onApprove, onReject, onDeploy, onSync, onVerify }: Props) {
    return (
        <section className="space-y-3">
            <AdminWorkTable
                works={works}
                title="Sudah On-chain / Terverifikasi"
                emptyMessage="Belum ada karya yang fully on-chain."
                actionBusyId={actionBusyId}
                onApprove={onApprove}
                onReject={onReject}
                onDeploy={onDeploy}
                onSync={onSync}
                onVerify={onVerify}
            />
        </section>
    );
}
