import { ReportForm } from "@/components/reports/ReportForm";
import { getProjectsByOwner } from "@/services/projectService";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewReportPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/");
    }

    // Only show projects owned by current user
    const projects = await getProjectsByOwner(currentUser.id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    สร้างรายงานใหม่
                </h1>
                <p className="text-sm opacity-70">
                    สร้างรายงานความคืบหน้าโครงการ (เฉพาะโครงการที่คุณเป็นเจ้าของ)
                </p>
            </div>

            <ReportForm projects={projects} />
        </div>
    );
}
