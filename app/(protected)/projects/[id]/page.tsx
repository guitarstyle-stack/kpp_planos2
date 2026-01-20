import { getProjectById } from "@/services/projectService";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faTrash,
    faArrowLeft,
    faCalendar,
    faMoneyBillWave,
    faChartPie,
    faBullseye,
    faBuilding,
    faUser,
    faQuoteLeft
} from "@fortawesome/free-solid-svg-icons";
import { deleteProjectAction } from "@/actions/projectActions";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/services/userRoleService";

// Map status to Thai label and color
const STATUS_MAP: Record<string, { label: string, color: string }> = {
    "NOT_STARTED": { label: "ยังไม่เริ่ม", color: "badge-ghost" },
    "IN_PROGRESS": { label: "กำลังดำเนินการ", color: "badge-info" },
    "COMPLETED": { label: "เสร็จสิ้น", color: "badge-success" },
    "CANCELLED": { label: "ยกเลิก", color: "badge-error" },
};

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
        console.log("Invalid ID:", params.id);
        notFound();
    }

    console.log("ProjectDetailPage rendering for ID:", id);
    const project = await getProjectById(id);

    if (!project) {
        console.log("Project not found for ID:", id);
        notFound();
    }

    // Check permissions
    const currentUser = await getCurrentUser();
    const isOwner = currentUser && project.ownerUserId === currentUser.id;
    const isAdmin = currentUser ? await hasRole(currentUser.id, "ADMIN") : false;
    const canDelete = isOwner || isAdmin;

    const { label: statusLabel, color: statusColor } = STATUS_MAP[project.status] || { label: project.status, color: "badge-ghost" };

    // Format helpers
    const formatDate = (date: Date | null) => date ? new Date(date).toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' }) : "-";
    const formatMoney = (amount: number | null) => (amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="text-sm breadcrumbs text-base-content/60 mb-2">
                        <ul>
                            <li><Link href="/projects">โครงการทั้งหมด</Link></li>
                            <li>{project.code}</li>
                        </ul>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/projects" className="btn btn-circle btn-ghost btn-sm">
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </Link>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-focus bg-clip-text text-transparent">
                            {project.name}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    {canDelete && (
                        <>
                            <Link href={`/projects/${project.id}/edit`} className="btn btn-primary btn-outline gap-2">
                                <FontAwesomeIcon icon={faEdit} /> แก้ไข
                            </Link>
                            <form action={async () => {
                                "use server";
                                await deleteProjectAction(project.id);
                                redirect("/projects");
                            }}>
                                <button className="btn btn-error btn-outline gap-2" type="submit">
                                    <FontAwesomeIcon icon={faTrash} /> ลบ
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="stats shadow w-full bg-base-100 border border-base-200 lg:stats-horizontal stats-vertical">
                <div className="stat">
                    <div className="stat-figure text-primary">
                        <FontAwesomeIcon icon={faMoneyBillWave} size="2x" />
                    </div>
                    <div className="stat-title">งบประมาณทั้งหมด</div>
                    <div className="stat-value text-primary">{formatMoney(project.budgetTotal)}</div>
                    <div className="stat-desc">บาท</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-secondary">
                        <FontAwesomeIcon icon={faChartPie} size="2x" />
                    </div>
                    <div className="stat-title">เบิกจ่ายแล้ว</div>
                    <div className="stat-value text-secondary">{formatMoney(project.budgetSpent)}</div>
                    <div className="stat-desc text-secondary">
                        {project.budgetTotal ? ((project.budgetSpent || 0) / project.budgetTotal * 100).toFixed(1) : 0}% ของงบประมาณ
                    </div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-accent">
                        <div className="radial-progress bg-primary text-primary-content border-4 border-primary" style={{ "--value": project.progressPercent || 0 } as any} role="progressbar">
                            {project.progressPercent}%
                        </div>
                    </div>
                    <div className="stat-title">ความคืบหน้า</div>
                    <div className="stat-value">{project.progressPercent}%</div>
                    <div className="stat-desc">{statusLabel}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="col-span-1 lg:col-span-2 space-y-8">

                    {/* General Info */}
                    <div className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4 border-b pb-2">
                                <FontAwesomeIcon icon={faBuilding} className="mr-2 text-primary" />
                                ข้อมูลทั่วไป
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                <div>
                                    <span className="text-sm text-base-content/60 block">รหัสโครงการ</span>
                                    <span className="font-medium text-lg font-mono">{project.code}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-base-content/60 block">ปีงบประมาณ</span>
                                    <span className="font-medium text-lg">{project.fiscalYear}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-base-content/60 block">สถานะ</span>
                                    <span className={`badge ${statusColor} badge-lg mt-1`}>{statusLabel}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-base-content/60 block">กลุ่มเป้าหมาย</span>
                                    <span className="font-medium">{project.targetGroup || "-"}</span>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <span className="text-sm text-base-content/60 block mb-1">รายละเอียด</span>
                                    <p className="whitespace-pre-wrap bg-base-50 p-4 rounded-lg text-sm leading-relaxed">
                                        {project.description || "ไม่มีรายละเอียดระบุ"}
                                    </p>
                                </div>
                            </div>

                            <div className="divider my-2"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-base-50 rounded-box">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <FontAwesomeIcon icon={faCalendar} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-base-content/60">ระยะเวลาดำเนินการ</div>
                                        <div className="font-medium text-sm">
                                            {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-base-50 rounded-box">
                                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                        <FontAwesomeIcon icon={faUser} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-base-content/60">ผู้รับผิดชอบ</div>
                                        <div className="font-medium text-sm">
                                            {project.ownerUser?.name || "ไม่ระบุ"}
                                        </div>
                                        <div className="text-xs text-base-content/60">
                                            {project.department?.name}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Indicators */}
                    <div className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4 border-b pb-2">
                                <FontAwesomeIcon icon={faBullseye} className="mr-2 text-accent" />
                                ตัวชี้วัดโครงการ (Indicators)
                            </h2>

                            {project.indicators && project.indicators.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>ชื่อตัวชี้วัด</th>
                                                <th className="text-center">ค่าเป้าหมาย</th>
                                                <th className="text-center">หน่วยนับ</th>
                                                {/* Future: Actual Value / Status */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {project.indicators.map((ind: any) => (
                                                <tr key={ind.id}>
                                                    <td className="font-medium">{ind.name}</td>
                                                    <td className="text-center">{ind.targetValue || "-"}</td>
                                                    <td className="text-center badge-ghost opacity-70">{ind.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-base-content/50 border-2 border-dashed rounded-lg">
                                    ไม่พบตัวชี้วัด
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Strategic Alignment */}
                <div className="col-span-1 space-y-8">
                    <div className="card bg-base-100 shadow-sm border border-base-200 h-fit">
                        <div className="card-body">
                            <h2 className="card-title text-base mb-6 text-base-content/70 uppercase tracking-widest border-b pb-2">
                                <FontAwesomeIcon icon={faQuoteLeft} className="mr-2 opacity-50" />
                                ความสอดคล้องเชิงยุทธศาสตร์
                            </h2>

                            {project.developmentGoal ? (
                                <div className="space-y-0">
                                    {/* Level 1: Annual Plan */}
                                    <div className="relative pl-8 pb-8 border-l-2 border-primary/20 last:border-0 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 bg-primary text-primary-content w-4 h-4 rounded-full border-2 border-base-100 shadow-sm"></div>
                                        <div className="-mt-1.5">
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">แผนพัฒนาคุณภาพชีวิต</span>
                                            <div className="font-semibold text-base leading-tight">
                                                {project.developmentGoal.issue?.annualPlan?.name || "ไม่ระบุ"}
                                            </div>
                                            <div className="text-xs text-base-content/50 mt-1">
                                                ปีงบประมาณ {project.developmentGoal.issue?.annualPlan?.fiscalYear}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Level 2: Issue */}
                                    <div className="relative pl-8 pb-8 border-l-2 border-primary/20 last:border-0 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 bg-secondary text-secondary-content w-4 h-4 rounded-full border-2 border-base-100 shadow-sm"></div>
                                        <div className="-mt-1.5">
                                            <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1 block">ประเด็นการพัฒนา</span>
                                            <div className="font-semibold text-base leading-tight">
                                                <span className="font-mono bg-base-200 px-1 py-0.5 rounded text-xs mr-2 text-base-content/70">
                                                    {project.developmentGoal.issue?.code}
                                                </span>
                                                {project.developmentGoal.issue?.name || "ไม่ระบุ"}
                                            </div>
                                            {project.developmentGoal.issue?.description && (
                                                <p className="text-xs text-base-content/60 mt-2 bg-base-50 p-2 rounded border border-base-200">
                                                    {project.developmentGoal.issue.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Level 3: Goal */}
                                    <div className="relative pl-8 border-l-2 border-transparent">
                                        <div className="absolute -left-[9px] top-0 bg-accent text-accent-content w-4 h-4 rounded-full border-2 border-base-100 shadow-sm"></div>
                                        <div className="-mt-1.5">
                                            <span className="text-xs font-bold text-accent uppercase tracking-wider mb-1 block">เป้าหมาย/เป้าประสงค์</span>
                                            <div className="font-semibold text-base leading-tight text-accent-focus">
                                                <span className="font-mono bg-accent/10 text-accent-focus px-1 py-0.5 rounded text-xs mr-2">
                                                    {project.developmentGoal.code}
                                                </span>
                                                {project.developmentGoal.name}
                                            </div>
                                            {project.developmentGoal.description && (
                                                <p className="text-xs text-base-content/60 mt-2 bg-base-50 p-2 rounded border border-base-200">
                                                    {project.developmentGoal.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-warning text-sm">
                                    <FontAwesomeIcon icon={faQuoteLeft} /> ยังไม่ได้ระบุความเชื่อมโยงกับแผนยุทธศาสตร์
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Attachments Placeholder (If needed later) */}
                    {/* 
                    <div className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body">
                            <h3 className="card-title text-sm">ไฟล์แนบ</h3>
                            <div className="text-center py-4 text-xs opacity-50">ไม่มีไฟล์แนบ</div>
                        </div>
                    </div> 
                    */}
                </div>
            </div>
        </div>
    );
}

// Ensure dynamic rendering so delete actions etc work proper
export const dynamic = 'force-dynamic';
