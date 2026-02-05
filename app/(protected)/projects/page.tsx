import Link from "next/link";
import { searchProjects, getProjectStats } from "@/services/projectService";
import { getDepartments } from "@/services/departmentService";
import { getDevelopmentGoals } from "@/services/developmentPlanService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFolder, faChartLine, faMoneyBillTrendUp, faClock } from "@fortawesome/free-solid-svg-icons";
import { StatusChart, DepartmentChart } from "@/components/dashboard/Charts";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/services/userService";
import { ProjectSearch } from "@/components/projects/ProjectSearch";
import { ResponsiveProjectsList } from "@/components/projects/ResponsiveProjectsList";

const STATUS_MAP: Record<string, { label: string, color: string }> = {
    "NOT_STARTED": { label: "ยังไม่เริ่ม", color: "badge-ghost" },
    "IN_PROGRESS": { label: "กำลังดำเนินการ", color: "badge-info" },
    "COMPLETED": { label: "เสร็จสิ้น", color: "badge-success" },
    "CANCELLED": { label: "ยกเลิก", color: "badge-error" },
};

interface ProjectsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
    const session = await getSession();
    if (!session || !session.user) {
        return <div>Access Denied</div>;
    }

    const params = await searchParams;
    const query = params.q as string || "";
    const status = params.status as string || undefined;
    const departmentIdParam = params.departmentId as string || undefined;
    const fiscalYearParam = params.fiscalYear as string || undefined;
    const goalIdParam = params.goalId as string || undefined;

    const user = await getUserById(Number(session.user.id));
    const userDepartmentId = user?.departmentId;
    const userDepartmentName = user?.department?.name;

    // Convert params to numbers
    const searchDepartmentId = departmentIdParam ? Number(departmentIdParam) : undefined;
    const searchFiscalYear = fiscalYearParam ? Number(fiscalYearParam) : undefined;
    const searchGoalId = goalIdParam ? Number(goalIdParam) : undefined;

    // Fetch data for filters
    const [searchResult, stats, departments, goals] = await Promise.all([
        searchProjects({
            query,
            status,
            departmentId: searchDepartmentId || userDepartmentId,
            fiscalYear: searchFiscalYear,
            goalId: searchGoalId,
            page: 1,
            limit: 100, // Show more results
        }),
        getProjectStats({
            departmentId: searchDepartmentId || userDepartmentId,
            fiscalYear: searchFiscalYear,
        }),
        getDepartments(),
        getDevelopmentGoals(),
    ]);

    const projects = searchResult.projects;

    // Generate years for filter (current year +/- 2)
    const currentYear = new Date().getFullYear() + 543;
    const fiscalYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).reverse();

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
                <div className="flex gap-3">
                    <Link
                        href="/projects/new"
                        className="btn btn-primary gap-2 shadow-lg shadow-primary/20"
                    >
                        <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                        สร้างโครงการใหม่
                    </Link>
                </div>
            </div>

            {/* Project Search */}
            <ProjectSearch
                departments={departments}
                years={fiscalYears}
                developmentGoals={goals}
            />

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
                        {searchFiscalYear ? `ปีงบประมาณ ${searchFiscalYear}` : 'ทุกปีงบประมาณ'}
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
                <div className="border-b border-base-200 bg-base-200/30 px-4 md:px-6 py-4 flex flex-col sm:flex-row gap-2 md:gap-4 justify-between items-start sm:items-center">
                    <h3 className="font-bold text-base md:text-lg">
                        รายการโครงการ
                        {query && <span className="text-primary text-sm md:text-base ml-2">({searchResult.total} ผลลัพธ์)</span>}
                        {searchFiscalYear && !query && <span className="text-primary text-sm md:text-base ml-2">(ปี {searchFiscalYear})</span>}
                    </h3>
                </div>
                <div className="p-0 md:p-4">
                    <ResponsiveProjectsList projects={projects} />
                </div>
            </div>
        </div>
    );
}
