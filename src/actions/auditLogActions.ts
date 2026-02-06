'use server'

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export interface GetAuditLogsParams {
    page?: number;
    pageSize?: number;
    entityType?: string;
    action?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
}

export async function getAuditLogsAction({
    page = 1,
    pageSize = 20,
    entityType,
    action,
    userId,
    startDate,
    endDate
}: GetAuditLogsParams) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return {
                success: false,
                message: "Unauthorized"
            };
        }

        // Check for SYSADMIN role
        const isAdmin = currentUser.roles.some((r) => r.role.name === "SYSADMIN");
        if (!isAdmin) {
            return {
                success: false,
                message: "Permission denied: Requires SYSADMIN role"
            };
        }

        const skip = (page - 1) * pageSize;

        // Build filter conditions
        const where: any = {};

        if (entityType) where.entityType = entityType;
        if (action) where.action = action;
        if (userId) where.userId = userId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                // Ensure end date covers the full day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const [logs, totalCount] = await Promise.all([
            db.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: pageSize,
            }),
            db.auditLog.count({ where })
        ]);

        return {
            success: true,
            data: logs,
            metadata: {
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            }
        };

    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return {
            success: false,
            message: "Failed to fetch audit logs"
        };
    }
}
