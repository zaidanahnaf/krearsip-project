import type { OnchainStatus } from "../../../api/types";
import { getOnchainBadgeClass, getOnchainBadgeLabel } from "../utils/rules";

export function OnchainBadge({ status }: { status: OnchainStatus }) {
    return (
        <span
            className={`inline-flex items-center text-[11px] px-2 py-[3px] rounded-full font-medium ${getOnchainBadgeClass(
                status
            )}`}
        >
            {getOnchainBadgeLabel(status)}
        </span>
    );
}
