import { ConversationStatus } from "@/services/conversationService";

interface ConversationStatusBadgeProps {
    status: ConversationStatus;
    className?: string;
}

export function ConversationStatusBadge({ status, className = "" }: ConversationStatusBadgeProps) {
    const statusConfig: Record<ConversationStatus, { label: string; badgeClass: string }> = {
        OPEN: { label: "เปิด", badgeClass: "badge-success" },
        IN_PROGRESS: { label: "กำลังดำเนินการ", badgeClass: "badge-info" },
        RESOLVED: { label: "แก้ไขแล้ว", badgeClass: "badge-warning" },
        CLOSED: { label: "ปิด", badgeClass: "badge-ghost" },
    };

    const config = statusConfig[status] || statusConfig.OPEN;

    return (
        <span className={`badge badge-sm ${config.badgeClass} ${className}`}>
            {config.label}
        </span>
    );
}
