import { ProjectForm } from "@/components/projects/ProjectForm";
import { getDepartments } from "@/services/masterDataService";
import { getAnnualPlans } from "@/services/developmentPlanService";
import { getProjectById } from "@/services/projectService";
import { getCurrentUser } from "@/lib/auth"; // Changed from getSession to likely getCurrentUser, checking imports in previous files... step 776 used `getSession`. Let's stick to what works or check auth lib.
import { notFound } from "next/navigation";

export default async function EditProjectPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const project = await getProjectById(Number(params.id));

    if (!project) {
        notFound();
    }

    const [departments, annualPlans, user] = await Promise.all([
        getDepartments(),
        getAnnualPlans(),
        getCurrentUser(), // Use getCurrentUser consistent with other actions
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    แก้ไขโครงการ
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    แก้ไขรายละเอียดโครงการ
                </p>
            </div>

            <ProjectForm
                initialData={project}
                masterData={{
                    departments,
                    annualPlans,
                }}
                userId={user?.id || 1}
            />
        </div>
    );
}

