import Link from "next/link";
import { getReports } from "@/services/reportService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEye, faFileAlt } from "@fortawesome/free-solid-svg-icons";

const periodLabels: Record<string, string> = {
    MID_6M: "รอบ 6 เดือน",
    MID_9M: "รอบ 9 เดือน",
    FULL_12M: "รอบ 12 เดือน",
};

export default async function ReportsPage() {
    const reports = await getReports();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        รายงานความคืบหน้า
                    </h1>
                    <p className="text-sm opacity-70">
                        รายงานผลการดำเนินงานโครงการตามรอบการรายงาน
                    </p>
                </div>
                <Link href="/reports/new" className="btn btn-primary gap-2">
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    สร้างรายงานใหม่
                </Link>
            </div>

            {/* Stats */}
            <div className="stats shadow-sm border border-base-300 w-full bg-base-100">
                <div className="stat">
                    <div className="stat-figure text-primary">
                        <FontAwesomeIcon icon={faFileAlt} className="h-8 w-8" />
                    </div>
                    <div className="stat-title">รายงานทั้งหมด</div>
                    <div className="stat-value text-primary">{reports.length}</div>
                </div>
            </div>

            {/* Reports Table */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="overflow-x-auto">
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
                                            <div className="font-bold">{report.project.name}</div>
                                            <div className="text-xs opacity-50">{report.project.code}</div>
                                        </div>
                                    </td>
                                    <td>{report.fiscalYear}</td>
                                    <td>
                                        <span className="badge badge-outline">
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
                                        <Link
                                            href={`/reports/${report.id}`}
                                            className="btn btn-ghost btn-sm gap-1"
                                        >
                                            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                                            ดู
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {reports.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 opacity-50">
                                        ยังไม่มีรายงาน
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
