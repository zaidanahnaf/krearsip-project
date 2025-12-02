import type { WorkStatus } from "../../../api/types";
import { getStatusBadgeClass, getStatusBadgeLabel } from "../utils/rules";

export function StatusBadge({ status }: { status: WorkStatus }) {
    return (
        <span
            className={`inline-flex items-center text-[11px] px-2 py-[3px] rounded-full font-medium ${getStatusBadgeClass(
                status
            )}`}
        >
            {getStatusBadgeLabel(status)}
        </span>
    );
}
