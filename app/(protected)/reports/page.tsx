import Link from "next/link";
import { getReports } from "@/services/reportService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/services/userRoleService";
import { ReportsListClient } from "@/components/reports/ReportsListClient";

export default async function ReportsPage() {
    const user = await getCurrentUser();
    const isAdmin = user ? await hasRole(user.id, "ADMIN") : false;

    // If not admin, filter by user's department
    const departmentId = !isAdmin && user?.departmentId ? user.departmentId : undefined;

    const reports = await getReports(departmentId);

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

            {/* Reports List */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="p-0 md:p-4">
                    <ReportsListClient
                        reports={reports}
                        isAdmin={isAdmin}
                        userId={user?.id}
                        userDepartmentId={user?.departmentId}
                    />
                </div>
            </div>
        </div>
    );
}
