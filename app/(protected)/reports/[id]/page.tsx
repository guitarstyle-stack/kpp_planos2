import { notFound } from "next/navigation";
import Link from "next/link";
import { getReportById } from "@/services/reportService";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/services/userRoleService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEdit, faCalendar, faUser, faBuilding, faTrash } from "@fortawesome/free-solid-svg-icons";

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

    const r = report as any;
    const currentUser = await getCurrentUser();

    // Check Permissions for Edit Button
    // Check Permissions
    let canEdit = false;
    let canDelete = false;

    if (currentUser) {
        const isAdmin = await hasRole(currentUser.id, "ADMIN");
        if (isAdmin) {
            canEdit = true;
            canDelete = true;
        } else {
            // Edit: Allow Department members or Project Owner
            const matchesDepartment = currentUser.departmentId === r.project?.departmentId;
            const isProjectOwner = currentUser.id === r.project?.ownerUserId;
            if (matchesDepartment || isProjectOwner) {
                canEdit = true;
            }

            // Delete: Strict (Project Owner OR Report Creator)
            const isReportCreator = currentUser.id === r.createdById;
            if (isProjectOwner || isReportCreator) {
                canDelete = true;
            }
        }
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
                            รายงาน: {r.project?.name}
                        </h1>
                        <p className="text-sm opacity-70">
                            {periodLabels[r.periodType]} ปีงบประมาณ {r.fiscalYear}
                        </p>
                    </div>
                </div>
                {canDelete && (
                    <div className="flex gap-2">
                        {canEdit && (
                            <Link href={`/reports/${id}/edit`} className="btn btn-primary btn-sm gap-2">
                                <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                แก้ไข
                            </Link>
                        )}
                        <form action={async () => {
                            "use server";
                            const { deleteReportAction } = await import("@/actions/reportActions");
                            await deleteReportAction(Number(id));
                            const { redirect } = await import("next/navigation");
                            redirect("/reports");
                        }}>
                            <button className="btn btn-error btn-outline btn-sm gap-2" type="submit">
                                <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                                ลบ
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Report Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Budget Tracking Section */}
                    <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
                        <div className="card-header bg-base-200/50 p-4 border-b border-base-300">
                            <h2 className="font-bold">ข้อมูลการเบิกจ่ายงบประมาณ</h2>
                        </div>
                        <div className="card-body p-0">
                            <div className="grid grid-cols-1 md:grid-cols-3">
                                <div className="p-6 border-r border-base-200 last:border-0">
                                    <div className="text-xs opacity-60 uppercase mb-1">เบิกจ่ายในรอบนี้</div>
                                    <div className="text-xl font-bold">
                                        {(r.budgetSpentInPeriod || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                        <span className="text-sm font-normal ml-1">บาท</span>
                                    </div>
                                </div>
                                <div className="p-6 border-r border-base-200 last:border-0">
                                    <div className="text-xs opacity-60 uppercase mb-1">เบิกจ่ายสะสมทั้งหมด</div>
                                    <div className="text-xl font-bold">
                                        {(r.budgetSpentCumulative || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                        <span className="text-sm font-normal ml-1">บาท</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-primary/5">
                                    <div className="text-xs opacity-60 uppercase mb-1">ความคืบหน้างบประมาณ</div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl font-black text-primary">
                                            {r.budgetProgressPercent || 0}%
                                        </div>
                                        <progress className="progress progress-primary w-full" value={r.budgetProgressPercent || 0} max="100"></progress>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KPI Achievement Section */}
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-header bg-base-200/50 p-4 border-b border-base-300 flex justify-between items-center">
                            <h2 className="font-bold">ผลการดำเนินงานตามตัวชี้วัด (KPIs)</h2>
                            <div className="badge badge-primary gap-2 p-3">
                                บรรลุ {r.kpiAchievedCount}/{r.kpiTotalCount} ตัวชี้วัด
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th className="w-10">#</th>
                                        <th>ตัวชี้วัด</th>
                                        <th className="text-center">เป้าหมาย</th>
                                        <th className="text-center">ผลที่ได้</th>
                                        <th className="text-center">ความสำเร็จ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {r.indicatorResults?.map((res: any, index: number) => (
                                        <tr key={res.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="font-medium">{res.indicator.name}</div>
                                            </td>
                                            <td className="text-center font-mono">
                                                {res.indicator.targetValue} {res.indicator.unit}
                                            </td>
                                            <td className="text-center font-bold">
                                                {res.actualValue !== null ? `${res.actualValue} ${res.indicator.unit}` : "-"}
                                            </td>
                                            <td className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`font-bold ${res.achievementPercent >= 100 ? 'text-success' : 'text-warning'}`}>
                                                        {res.achievementPercent}%
                                                    </span>
                                                    <progress
                                                        className={`progress w-16 ${res.achievementPercent >= 100 ? 'progress-success' : 'progress-warning'}`}
                                                        value={res.achievementPercent}
                                                        max="100"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!r.indicatorResults || r.indicatorResults.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 opacity-50 italic">
                                                ไม่มีข้อมูลตัวชี้วัดแบบละเอียด
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h2 className="card-title text-lg border-b pb-2">สรุปผลการดำเนินงาน</h2>
                            <p className="whitespace-pre-wrap leading-relaxed">
                                {r.summary || <span className="italic opacity-50">ไม่มีข้อมูล</span>}
                            </p>
                        </div>
                    </div>

                    {/* Issues & Resolution Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card bg-base-100 shadow-sm border border-base-300">
                            <div className="card-body">
                                <h2 className="card-title text-lg border-b pb-2 text-error">ปัญหาอุปสรรค</h2>
                                <p className="whitespace-pre-wrap text-sm">
                                    {r.issues || <span className="italic opacity-50">ไม่มีปัญหา</span>}
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm border border-base-300">
                            <div className="card-body">
                                <h2 className="card-title text-lg border-b pb-2 text-success">แนวทางแก้ไข</h2>
                                <p className="whitespace-pre-wrap text-sm">
                                    {r.resolutionPlan || <span className="italic opacity-50">ไม่มีข้อมูล</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Overall Progress Card */}
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body text-center">
                            <h2 className="card-title text-lg justify-center mb-4">ความก้าวหน้าโครงการรวม</h2>
                            <div className="flex flex-col items-center py-2">
                                <div className="radial-progress text-primary border-4 border-primary/10" style={{ "--value": Math.min(r.overallProgressPercent || 0, 100), "--size": "10rem", "--thickness": "0.8rem" } as React.CSSProperties}>
                                    <span className="text-2xl font-black">{r.overallProgressPercent || 0}%</span>
                                </div>
                            </div>
                            <div className="text-xs opacity-50 mt-4">
                                ประเมินโดย {r.createdBy?.name || "ไม่ระบุ"}
                            </div>
                        </div>
                    </div>

                    {/* Report Information Card */}
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h2 className="card-title text-lg border-b pb-2">ข้อมูลรายงาน</h2>
                            <div className="space-y-4 mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-base-200 p-2 rounded-lg">
                                        <FontAwesomeIcon icon={faBuilding} className="h-4 w-4 opacity-70" />
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-50">รหัสโครงการ</div>
                                        <div className="font-mono font-bold">{r.project?.code}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-base-200 p-2 rounded-lg">
                                        <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 opacity-70" />
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-50">วันที่รายงาน</div>
                                        <div className="font-medium">{new Date(r.createdAt).toLocaleDateString("th-TH", { dateStyle: "long" })}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-base-200 p-2 rounded-lg">
                                        <FontAwesomeIcon icon={faUser} className="h-4 w-4 opacity-70" />
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-50">ผู้นำเสนอ</div>
                                        <div className="font-medium">{r.createdBy?.name || "ไม่ระบุ"}</div>
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
