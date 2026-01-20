import { DevelopmentIssueForm } from "@/components/settings/DevelopmentIssueForm";
import { getAnnualPlans } from "@/services/developmentPlanService";

export default async function NewDevelopmentIssuePage() {
    const annualPlans = await getAnnualPlans();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    สร้างประเด็นการพัฒนา
                </h1>
                <p className="text-sm opacity-70">
                    กรอกข้อมูลเพื่อสร้างประเด็นการพัฒนาใหม่
                </p>
            </div>

            <DevelopmentIssueForm annualPlans={annualPlans} />
        </div>
    );
}
