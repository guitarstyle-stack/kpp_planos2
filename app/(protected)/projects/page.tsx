import Link from "next/link";
import { getProjects, getProjectStats } from "@/services/projectService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSearch, faFolder, faChartLine, faFolderOpen, faMoneyBillTrendUp, faClock } from "@fortawesome/free-solid-svg-icons";
import { StatusChart, DepartmentChart } from "@/components/dashboard/Charts";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/services/userService";
const STATUS_MAP: Record<string, { label: string, color: string }> = {
    "NOT_STARTED": { label: "ยังไม่เริ่ม", color: "badge-ghost" },
    "IN_PROGRESS": { label: "กำลังดำเนินการ", color: "badge-info" },
    "COMPLETED": { label: "เสร็จสิ้น", color: "badge-success" },
    "CANCELLED": { label: "ยกเลิก", color: "badge-error" },
};

export default async function ProjectsPage() {
    const session = await getSession();
    if (!session || !session.user) {
        return <div>Access Denied</div>;
    }

    const user = await getUserById(Number(session.user.id));
    const userDepartmentId = user?.departmentId;
    const userDepartmentName = user?.department?.name;

    const [projects, stats] = await Promise.all([
        getProjects({ departmentId: userDepartmentId }),
        getProjectStats({ departmentId: userDepartmentId }),
    ]);

    // Format helpers
    const formatMoney = (amount: number) => amount.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const formatCompact = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
        return amount.toLocaleString();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        โครงการ {userDepartmentName}
                    </h1>
                    <p className="text-sm opacity-70">
                        บริหารจัดการโครงการและติดตามความคืบหน้า
                    </p>
                </div>
                <Link
                    href="/projects/new"
                    className="btn btn-primary gap-2 shadow-lg shadow-primary/20"
                >
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    สร้างโครงการใหม่
                </Link>
            </div>

            {/* Stats Cards - Real Data */}
            <div className="stats shadow-sm border border-base-200 w-full bg-base-100 lg:stats-horizontal stats-vertical">
                <div className="stat">
                    <div className="stat-figure text-primary">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faFolder} className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="stat-title opacity-70">โครงการทั้งหมด</div>
                    <div className="stat-value text-primary">{stats.totalProjects}</div>
                    <div className="stat-desc">
                        เสร็จแล้ว {stats.statusCounts.COMPLETED} | กำลังดำเนินการ {stats.statusCounts.IN_PROGRESS}
                    </div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-success">
                        <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faChartLine} className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="stat-title opacity-70">ความก้าวหน้าเฉลี่ย</div>
                    <div className="stat-value text-success">{stats.avgProgress}%</div>
                    <div className="stat-desc">จากโครงการทั้งหมด</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-info">
                        <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faMoneyBillTrendUp} className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="stat-title opacity-70">งบประมาณรวม</div>
                    <div className="stat-value text-info">{formatCompact(stats.totalBudget)}</div>
                    <div className="stat-desc">ใช้ไป {formatCompact(stats.totalSpent)} บาท</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-warning">
                        <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faClock} className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="stat-title opacity-70">รอรายงาน</div>
                    <div className="stat-value text-warning">{stats.pendingReports}</div>
                    <div className="stat-desc">โครงการที่ต้องอัปเดต</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <h3 className="card-title text-base border-b pb-2 mb-2">สถานะโครงการ</h3>
                        <StatusChart statusCounts={stats.statusCounts} />
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <h3 className="card-title text-base border-b pb-2 mb-2">โครงการแยกตามหน่วยงาน</h3>
                        <DepartmentChart departmentCounts={stats.departmentCounts} />
                    </div>
                </div>
            </div>

            {/* Projects Table */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="border-b border-base-200 bg-base-200/30 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <h3 className="font-bold text-lg">รายการโครงการ</h3>
                    <div className="relative w-full sm:w-72">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FontAwesomeIcon icon={faSearch} className="h-4 w-4 opacity-50" />
                        </div>
                        <input
                            type="text"
                            className="input input-bordered input-sm w-full pl-10"
                            placeholder="ค้นหาโครงการ..."
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="bg-base-200/50">
                                <th>รหัสโครงการ</th>
                                <th>ชื่อโครงการ</th>
                                <th className="text-center">สถานะ</th>
                                <th className="text-center">ความคืบหน้า</th>
                                <th>เป้าประสงค์</th>
                                <th>หน่วยงาน</th>
                                <th>งบประมาณ</th>
                                <th className="text-right">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project: any) => (
                                <tr key={project.id} className="hover">
                                    <td className="font-mono text-xs opacity-70">
                                        {project.code}
                                    </td>
                                    <td>
                                        <div className="font-bold text-sm line-clamp-2 max-w-sm" title={project.name}>
                                            {project.name}
                                        </div>
                                    </td>
                                    <td className="text-center whitespace-nowrap">
                                        <span className={`badge ${STATUS_MAP[project.status]?.color || 'badge-ghost'} badge-sm`}>
                                            {STATUS_MAP[project.status]?.label || project.status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center gap-2 justify-center">
                                            <progress
                                                className="progress progress-primary w-20"
                                                value={project.progressPercent || 0}
                                                max="100"
                                            />
                                            <span className="text-xs font-medium">{project.progressPercent || 0}%</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap max-w-[200px]">
                                        <div className="truncate text-xs opacity-70" title={project.developmentGoal?.name || ""}>
                                            {project.developmentGoal?.name || "-"}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap text-sm">
                                        {project.department?.name || "-"}
                                    </td>
                                    <td className="whitespace-nowrap text-xs font-mono">
                                        {project.budgetTotal ? formatMoney(project.budgetTotal) : "-"}
                                    </td>
                                    <td className="text-right">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="btn btn-ghost btn-xs text-primary"
                                        >
                                            ดูรายละเอียด
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {projects.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-24">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <FontAwesomeIcon icon={faFolderOpen} className="h-12 w-12 mb-4" />
                                            <p className="text-lg font-medium">ยังไม่มีโครงการ</p>
                                            <p className="text-sm">เริ่มต้นด้วยการสร้างโครงการใหม่</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div >
        </div >
    );
}
