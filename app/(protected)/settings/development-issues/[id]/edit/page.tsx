import { notFound } from "next/navigation";
import db from "@/lib/db";
import { DevelopmentIssueForm } from "@/components/settings/DevelopmentIssueForm";
import { getAnnualPlans } from "@/services/developmentPlanService";

export default async function EditDevelopmentIssuePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [issue, annualPlans] = await Promise.all([
        db.developmentIssue.findUnique({
            where: { id: Number(id) },
        }),
        getAnnualPlans(),
    ]);

    if (!issue) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    แก้ไขประเด็นการพัฒนา
                </h1>
                <p className="text-sm opacity-70">
                    แก้ไขข้อมูลประเด็นการพัฒนา
                </p>
            </div>

            <DevelopmentIssueForm initialData={issue} annualPlans={annualPlans} />
        </div>
    );
}
