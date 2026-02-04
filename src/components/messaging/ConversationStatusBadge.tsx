import { ConversationStatus } from "@/services/conversationService";

interface ConversationStatusBadgeProps {
    status: ConversationStatus;
    className?: string;
}

export function ConversationStatusBadge({ status, className = "" }: ConversationStatusBadgeProps) {
    const statusConfig: Record<ConversationStatus, { label: string; color: string }> = {
        OPEN: { label: "เปิด", color: "bg-blue-100 text-blue-800" },
        IN_PROGRESS: { label: "กำลังดำเนินการ", color: "bg-yellow-100 text-yellow-800" },
        RESOLVED: { label: "แก้ไขแล้ว", color: "bg-green-100 text-green-800" },
        CLOSED: { label: "ปิด", color: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status] || statusConfig.OPEN;

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}
        >
            {config.label}
        </span>
    );
}
