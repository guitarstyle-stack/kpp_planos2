import { notFound } from "next/navigation";
import Link from "next/link";
import { getReportById } from "@/services/reportService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEdit, faCalendar, faUser, faBuilding } from "@fortawesome/free-solid-svg-icons";

const periodLabels: Record<string, string> = {
    MID_6M: "รอบ 6 เดือน",
    MID_9M: "รอบ 9 เดือน",
    FULL_12M: "รอบ 12 เดือน",
};

interface ReportViewPageProps {
    params: Promise<{ id: string }>;
}

export default async function ReportViewPage({ params }: ReportViewPageProps) {
    const { id } = await params;
    const report = await getReportById(Number(id));

    if (!report) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/reports" className="btn btn-ghost btn-sm">
                        <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            รายงาน: {report.project.name}
                        </h1>
                        <p className="text-sm opacity-70">
                            {periodLabels[report.periodType]} ปีงบประมาณ {report.fiscalYear}
                        </p>
                    </div>
                </div>
                <Link href={`/reports/${id}/edit`} className="btn btn-primary btn-sm gap-2">
                    <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                    แก้ไข
                </Link>
            </div>

            {/* Report Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Card */}
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h2 className="card-title text-lg">สรุปผลการดำเนินงาน</h2>
                            <p className="whitespace-pre-wrap">
                                {report.summary || <span className="italic opacity-50">ไม่มีข้อมูล</span>}
                            </p>
                        </div>
                    </div>

                    {/* Issues Card */}
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h2 className="card-title text-lg">ปัญหาอุปสรรค</h2>
                            <p className="whitespace-pre-wrap">
                                {report.issues || <span className="italic opacity-50">ไม่มีปัญหา</span>}
                            </p>
                        </div>
                    </div>

                    {/* Resolution Card */}
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h2 className="card-title text-lg">แนวทางแก้ไข</h2>
                            <p className="whitespace-pre-wrap">
                                {report.resolutionPlan || <span className="italic opacity-50">ไม่มีข้อมูล</span>}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Progress Card */}
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h2 className="card-title text-lg">ความก้าวหน้า</h2>
                            <div className="flex flex-col items-center py-4">
                                <div className="radial-progress text-primary" style={{ "--value": report.overallProgressPercent || 0, "--size": "8rem" } as React.CSSProperties}>
                                    {report.overallProgressPercent || 0}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h2 className="card-title text-lg">ข้อมูลรายงาน</h2>
                            <div className="space-y-3 mt-2">
                                <div className="flex items-center gap-3">
                                    <FontAwesomeIcon icon={faBuilding} className="h-4 w-4 opacity-50" />
                                    <div>
                                        <div className="text-xs opacity-50">โครงการ</div>
                                        <div className="font-medium">{report.project.code}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 opacity-50" />
                                    <div>
                                        <div className="text-xs opacity-50">วันที่สร้าง</div>
                                        <div>{new Date(report.createdAt).toLocaleDateString("th-TH", { dateStyle: "long" })}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 opacity-50" />
                                    <div>
                                        <div className="text-xs opacity-50">ผู้จัดทำ</div>
                                        <div>{report.createdBy.name}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
