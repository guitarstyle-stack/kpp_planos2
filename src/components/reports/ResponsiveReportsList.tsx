'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';

interface Report {
    id: number;
    fiscalYear: number;
    periodType: string;
    overallProgressPercent: number | null;
    createdAt: Date;
    project: {
        name: string;
        code: string;
        ownerUserId: number;
        departmentId: number;
    };
    createdBy: {
        name: string;
    };
}

interface ResponsiveReportsListProps {
    reports: Report[];
    isAdmin: boolean;
    userId?: number;
    userDepartmentId?: number;
}

const periodLabels: Record<string, string> = {
    MID_6M: "รอบ 6 เดือน",
    MID_9M: "รอบ 9 เดือน",
    FULL_12M: "รอบ 12 เดือน",
};

export function ResponsiveReportsList({ reports, isAdmin, userId, userDepartmentId }: ResponsiveReportsListProps) {
    const canEdit = (report: Report) => {
        return isAdmin || (userId && (userId === report.project.ownerUserId || userDepartmentId === report.project.departmentId));
    };

    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 opacity-50">
                <FontAwesomeIcon icon={faFileAlt} className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">ยังไม่มีรายงาน</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block table-container">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>โครงการ</th>
                            <th>ปีงบประมาณ</th>
                            <th>รอบรายงาน</th>
                            <th>ความก้าวหน้า</th>
                            <th>ผู้จัดทำ</th>
                            <th>วันที่สร้าง</th>
                            <th><span className="sr-only">ดู</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report) => (
                            <tr key={report.id} className="hover">
                                <td className="font-medium">
                                    <div>
                                        <div className="font-bold truncate max-w-[250px]" title={report.project.name}>
                                            {report.project.name}
                                        </div>
                                        <div className="text-xs opacity-50">{report.project.code}</div>
                                    </div>
                                </td>
                                <td>{report.fiscalYear}</td>
                                <td>
                                    <span className="badge badge-outline whitespace-nowrap min-w-max h-auto py-1">
                                        {periodLabels[report.periodType] || report.periodType}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <progress
                                            className="progress progress-primary w-20"
                                            value={report.overallProgressPercent || 0}
                                            max="100"
                                        />
                                        <span className="text-sm">{report.overallProgressPercent || 0}%</span>
                                    </div>
                                </td>
                                <td>{report.createdBy.name}</td>
                                <td className="opacity-70">
                                    {new Date(report.createdAt).toLocaleDateString("th-TH")}
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/reports/${report.id}`}
                                            className="btn btn-ghost btn-sm"
                                        >
                                            ดู
                                        </Link>
                                        {canEdit(report) && (
                                            <Link
                                                href={`/reports/${report.id}/edit`}
                                                className="btn btn-ghost btn-sm text-primary"
                                            >
                                                แก้ไข
                                            </Link>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
                {reports.map((report) => (
                    <div key={report.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body p-4">
                            {/* Header */}
                            <div className="mb-3">
                                <h3 className="font-bold text-base line-clamp-2 mb-1">
                                    {report.project.name}
                                </h3>
                                <p className="text-xs font-mono opacity-60">
                                    {report.project.code}
                                </p>
                            </div>

                            {/* Progress */}
                            <div className="space-y-1 mb-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="opacity-60">ความก้าวหน้า</span>
                                    <span className="font-bold">{report.overallProgressPercent || 0}%</span>
                                </div>
                                <progress
                                    className="progress progress-primary w-full h-2"
                                    value={report.overallProgressPercent || 0}
                                    max="100"
                                />
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                <div>
                                    <div className="text-xs opacity-60 mb-1">ปีงบประมาณ</div>
                                    <div className="font-medium">{report.fiscalYear}</div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-60 mb-1">รอบรายงาน</div>
                                    <span className="badge badge-outline badge-sm">
                                        {periodLabels[report.periodType] || report.periodType}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-xs opacity-60 mb-1">ผู้จัดทำ</div>
                                    <div className="font-medium truncate">{report.createdBy.name}</div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-60 mb-1">วันที่สร้าง</div>
                                    <div className="font-medium text-xs">
                                        {new Date(report.createdAt).toLocaleDateString("th-TH", {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Link
                                    href={`/reports/${report.id}`}
                                    className="btn btn-outline btn-sm flex-1"
                                >
                                    ดูรายละเอียด
                                </Link>
                                {canEdit(report) && (
                                    <Link
                                        href={`/reports/${report.id}/edit`}
                                        className="btn btn-primary btn-sm flex-1"
                                    >
                                        แก้ไข
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
