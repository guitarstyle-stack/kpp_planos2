import { ReportForm } from "@/components/reports/ReportForm";
import { getProjects } from "@/services/projectService";

export default async function NewReportPage() {
    const projects = await getProjects();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    สร้างรายงานใหม่
                </h1>
                <p className="text-sm opacity-70">
                    สร้างรายงานความคืบหน้าโครงการ
                </p>
            </div>

            <ReportForm projects={projects} />
        </div>
    );
}
