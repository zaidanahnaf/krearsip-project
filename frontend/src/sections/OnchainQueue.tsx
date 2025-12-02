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

export function OnchainQueue({ works, actionBusyId, onApprove, onReject, onDeploy, onSync, onVerify }: Props) {
    return (
        <section className="space-y-3">
            <AdminWorkTable
                works={works}
                title="Antrian On-chain"
                emptyMessage="Belum ada karya di antrian on-chain."
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
