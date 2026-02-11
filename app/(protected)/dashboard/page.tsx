import Link from "next/link";
import { getProjects, getProjectStats } from "@/services/projectService";
import { getDepartments } from "@/services/departmentService";
import { getDevelopmentIssues } from "@/services/developmentPlanService";
import db from "@/lib/db";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faChartLine, faMoneyBillTrendUp, faClock, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { StatusChart, DepartmentChart, FiscalYearChart, BudgetChart, ProgressDistributionChart, KPIChart, StrategicChart, RiskSummaryCard, DepartmentProgressChart } from "@/components/dashboard/Charts";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";

import { AIExecutiveBriefing } from "@/components/dashboard/AIExecutiveBriefing";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    const fiscalYear = resolvedSearchParams.fiscalYear ? Number(resolvedSearchParams.fiscalYear) : undefined;
    const departmentId = resolvedSearchParams.departmentId ? Number(resolvedSearchParams.departmentId) : undefined;
    const issueId = resolvedSearchParams.issueId ? Number(resolvedSearchParams.issueId) : undefined;

    const [projects, stats, departments, issues, fiscalYears] = await Promise.all([
        getProjects(), // Note: List is not filtered by default as per UI design (usually keeps list full, but stats filtered). If list should also be filtered, we need to update getProjects too.
        getProjectStats({ fiscalYear, departmentId, issueId }),
        getDepartments(),
        getDevelopmentIssues(),
        db.project.findMany({ select: { fiscalYear: true }, distinct: ['fiscalYear'], orderBy: { fiscalYear: 'desc' } }),
    ]);

    const years = fiscalYears.map((p: { fiscalYear: number }) => p.fiscalYear);

    // Format budget for display
    const formatBudget = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
        return amount.toLocaleString();
    };

    const recentProjects = projects.slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    ภาพรวมระบบ
                </h1>
                <p className="text-sm opacity-70">
                    สรุปข้อมูลโครงการและสถานะการดำเนินงาน
                </p>
            </div>

            {/* AI Executive Briefing */}
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                <AIExecutiveBriefing stats={stats} />
            </div>

            {/* Filters */}
            <DashboardFilters
                years={years}
                departments={departments.map((d: { id: number; name: string }) => ({ id: d.id, name: d.name }))}
                issues={issues.map((i: { id: number; name: string }) => ({ id: i.id, name: i.name }))}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stats shadow-sm border border-base-300 bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <FontAwesomeIcon icon={faFolder} className="h-6 w-6 opacity-20" />
                        </div>
                        <div className="stat-title">โครงการทั้งหมด</div>
                        <div className="stat-value text-primary">{stats.totalProjects}</div>
                        <div className="stat-desc">โครงการ</div>
                    </div>
                </div>

                <div className="stats shadow-sm border border-base-300 bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-success">
                            <FontAwesomeIcon icon={faChartLine} className="h-6 w-6 opacity-20" />
                        </div>
                        <div className="stat-title">ความก้าวหน้าเฉลี่ย</div>
                        <div className="stat-value text-success">{stats.avgProgress}%</div>
                        <div className="stat-desc">จากเป้าหมายรวม</div>
                    </div>
                </div>

                <div className="stats shadow-sm border border-base-300 bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-info">
                            <FontAwesomeIcon icon={faMoneyBillTrendUp} className="h-6 w-6 opacity-20" />
                        </div>
                        <div className="stat-title">งบประมาณรวม</div>
                        <div className="stat-value text-info text-2xl">{formatBudget(stats.totalBudget)}</div>
                        <div className="stat-desc">ใช้ไป {formatBudget(stats.totalSpent)}</div>
                    </div>
                </div>

                <div className="stats shadow-sm border border-base-300 bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-warning">
                            <FontAwesomeIcon icon={faClock} className="h-6 w-6 opacity-20" />
                        </div>
                        <div className="stat-title">รอรายงาน</div>
                        <div className="stat-value text-warning">{stats.pendingReports}</div>
                        <div className="stat-desc">โครงการ</div>
                    </div>
                </div>
            </div>


            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Column 1: Strategy & Alignment (PMO Focus) */}
                <div className="space-y-6 xl:col-span-1">
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h3 className="card-title text-base mb-4 flex justify-between items-center">
                                <span>ความสอดคล้องเชิงยุทธศาสตร์</span>
                                <span className="badge badge-primary badge-outline text-xs">Strategy</span>
                            </h3>
                            <StrategicChart strategicCounts={stats.strategicCounts} />
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h3 className="card-title text-base mb-4">โครงการตามปีงบประมาณ</h3>
                            <FiscalYearChart yearlyCounts={stats.yearlyCounts} />
                        </div>
                    </div>
                </div>

                {/* Column 2: Health & Risk (PMO Focus) */}
                <div className="space-y-6 xl:col-span-1">
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h3 className="card-title text-base mb-4 flex justify-between items-center">
                                <span>สุขภาพพอร์ตโฟลิโอ (Portfolio Health)</span>
                                <span className="badge badge-error badge-outline text-xs">Risk</span>
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                <RiskSummaryCard
                                    projectsWithIssuesCount={stats.projectsWithIssuesCount}
                                    totalProjects={stats.totalProjects}
                                />
                                <div className="divider my-0"></div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 opacity-80">สถานะโครงการ</h4>
                                    <StatusChart statusCounts={stats.statusCounts} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h3 className="card-title text-base mb-4">การกระจายตัวความก้าวหน้า</h3>
                            <ProgressDistributionChart distribution={stats.progressDistribution} />
                        </div>
                    </div>
                </div>

                {/* Column 3: Performance & Finance */}
                <div className="space-y-6 xl:col-span-1">
                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h3 className="card-title text-base mb-4">ผลการดำเนินงานตัวชี้วัด (KPI)</h3>
                            <KPIChart stats={stats.kpiStats} />
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h3 className="card-title text-base mb-4">การเบิกจ่ายงบประมาณ (Top Depts)</h3>
                            <BudgetChart budgetByDepartment={stats.budgetByDepartment} />
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm border border-base-300">
                        <div className="card-body">
                            <h3 className="card-title text-base mb-4 flex justify-between items-center">
                                <span>ประสิทธิภาพรายหน่วยงาน</span>
                                <span className="badge badge-info badge-outline text-xs">Avg Progress</span>
                            </h3>
                            <DepartmentProgressChart avgProgressByDepartment={stats.avgProgressByDepartment} />
                        </div>
                    </div>
                </div>

                {/* Full Width: Department Overview */}
                <div className="card bg-base-100 shadow-sm border border-base-300 xl:col-span-3">
                    <div className="card-body">
                        <h3 className="card-title text-base mb-4">จำนวนโครงการแยกตามหน่วยงาน</h3>
                        <DepartmentChart departmentCounts={stats.departmentCounts} />
                    </div>
                </div>
            </div>

            {/* Recent Projects */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-header px-6 py-4 border-b border-base-200 flex justify-between items-center">
                    <h3 className="font-semibold">โครงการล่าสุด</h3>
                    <Link href="/projects" className="btn btn-xs btn-ghost gap-2">
                        ดูทั้งหมด
                        <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>รหัส</th>
                                <th>ชื่อโครงการ</th>
                                <th>สถานะ</th>
                                <th>หน่วยงาน</th>
                                <th className="text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentProjects.map((project: any) => (
                                <tr key={project.id}>
                                    <td className="font-medium text-xs">{project.code}</td>
                                    <td>
                                        <div className="font-medium truncate max-w-[200px]" title={project.name}>
                                            {project.name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-sm ${project.status === "NOT_STARTED" ? "badge-ghost" :
                                            project.status === "IN_PROGRESS" ? "badge-info" :
                                                project.status === "COMPLETED" ? "badge-success" :
                                                    project.status === "CANCELLED" ? "badge-error" :
                                                        "badge-info"
                                            }`}>
                                            {project.status === "NOT_STARTED" ? "ยังไม่เริ่ม" :
                                                project.status === "IN_PROGRESS" ? "กำลังดำเนินการ" :
                                                    project.status === "COMPLETED" ? "เสร็จสิ้น" :
                                                        project.status === "CANCELLED" ? "ยกเลิก" :
                                                            project.status}
                                        </span>
                                    </td>
                                    <td className="text-xs">{project.department?.name || "-"}</td>
                                    <td className="text-right">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="btn btn-ghost btn-xs"
                                        >
                                            ดู
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {recentProjects.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 opacity-50">
                                        ยังไม่มีข้อมูลโครงการ
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
