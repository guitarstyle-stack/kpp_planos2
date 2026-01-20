import { ProjectForm } from "@/components/projects/ProjectForm";
import { getDepartments } from "@/services/masterDataService";
import { getAnnualPlans } from "@/services/developmentPlanService";
import { getSession } from "@/lib/auth";

export default async function NewProjectPage() {
    const session = await getSession();
    const departments = await getDepartments();
    const annualPlans = await getAnnualPlans();

    const masterData = {
        departments,
        annualPlans,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    สร้างโครงการใหม่
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    กรอกข้อมูลเพื่อสร้างโครงการใหม่ในระบบ
                </p>
            </div>

            <ProjectForm
                masterData={masterData}
                userId={session?.user?.id || 1} // Fallback for dev 
            />
        </div>
    );
}

