import db from "@/lib/db";
import { Prisma } from "@prisma/client";

export type ReportWithDetails = Prisma.ReportGetPayload<{
    include: {
        project: { select: { id: true; name: true; code: true; departmentId: true; ownerUserId: true; budgetTotal: true } };
        createdBy: { select: { id: true; name: true } };
        attachments: true;
    };
}>;

export async function getReports(departmentId?: number) {
    return await db.report.findMany({
        where: departmentId ? {
            project: {
                departmentId: departmentId
            }
        } : undefined,
        include: {
            project: {
                select: { id: true, name: true, code: true, departmentId: true, ownerUserId: true, budgetTotal: true },
            },
            createdBy: {
                select: { id: true, name: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getReportById(id: number) {
    return await db.report.findUnique({
        where: { id },
        include: {
            project: {
                select: { id: true, name: true, code: true, departmentId: true, ownerUserId: true, budgetTotal: true },
            },
            createdBy: {
                select: { id: true, name: true },
            },
            attachments: true,
            indicatorResults: {
                include: {
                    indicator: true
                }
            }
        },
    });
}

export async function getReportsByProject(projectId: number) {
    return await db.report.findMany({
        where: { projectId },
        include: {
            createdBy: {
                select: { id: true, name: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createReport(data: Prisma.ReportUncheckedCreateInput) {
    return await db.report.create({ data });
}

export async function updateReport(id: number, data: Prisma.ReportUncheckedUpdateInput) {
    return await db.report.update({ where: { id }, data });
}

export async function deleteReport(id: number) {
    return await db.report.delete({ where: { id } });
}

export async function getPreviousCumulativeBudget(projectId: number, fiscalYear: number): Promise<number> {
    const latestReport = await db.report.findFirst({
        where: { projectId, fiscalYear },
        orderBy: { createdAt: 'desc' },
        select: { budgetSpentCumulative: true },
    });

    return latestReport?.budgetSpentCumulative || 0;
}
