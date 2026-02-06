import db from "@/lib/db";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT" | "IMPORT" | "OTHER";

interface CreateAuditLogParams {
    action: AuditAction;
    entityType: string;
    entityId?: number;
    description?: string;
    diffBefore?: any;
    diffAfter?: any;
    userId?: number;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
}

/**
 * Creates an audit log entry in the database.
 * This function should be called from Server Actions or Services.
 */
export async function createAuditLog({
    action,
    entityType,
    entityId,
    description,
    diffBefore,
    diffAfter,
    userId,
    ipAddress,
    userAgent,
    requestId,
}: CreateAuditLogParams) {
    try {
        await db.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                description,
                diffBefore: diffBefore ? JSON.parse(JSON.stringify(diffBefore)) : undefined, // Ensure serializable
                diffAfter: diffAfter ? JSON.parse(JSON.stringify(diffAfter)) : undefined,
                userId,
                ipAddress,
                userAgent,
                requestId,
            },
        });
    } catch (error) {
        // We generally don't want audit logging failure to block the main action,
        // but we should log the error to the console.
        console.error("Failed to create audit log:", error);
    }
}
