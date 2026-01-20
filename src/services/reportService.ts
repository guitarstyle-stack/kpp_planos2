import db from "@/lib/db";
import { Prisma } from "@prisma/client";

export type ReportWithDetails = Prisma.ReportGetPayload<{
    include: {
        project: { select: { id: true; name: true; code: true } };
        createdBy: { select: { id: true; name: true } };
        attachments: true;
    };
}>;

export async function getReports() {
    return await db.report.findMany({
        include: {
            project: {
                select: { id: true, name: true, code: true },
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
                select: { id: true, name: true, code: true, department: true },
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
