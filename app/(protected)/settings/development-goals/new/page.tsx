import { DevelopmentGoalForm } from "@/components/settings/DevelopmentGoalForm";
import { getDevelopmentIssues } from "@/services/developmentPlanService";

export default async function NewDevelopmentGoalPage() {
    const issues = await getDevelopmentIssues();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    สร้างเป้าหมาย
                </h1>
                <p className="text-sm opacity-70">
                    กรอกข้อมูลเพื่อสร้างเป้าหมายใหม่
                </p>
            </div>

            <DevelopmentGoalForm issues={issues} />
        </div>
    );
}
