import { notFound } from "next/navigation";
import db from "@/lib/db";
import { DevelopmentGoalForm } from "@/components/settings/DevelopmentGoalForm";
import { getDevelopmentIssues } from "@/services/developmentPlanService";

export default async function EditDevelopmentGoalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [goal, issues] = await Promise.all([
        db.developmentGoal.findUnique({
            where: { id: Number(id) },
        }),
        getDevelopmentIssues(),
    ]);

    if (!goal) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    แก้ไขเป้าหมาย
                </h1>
                <p className="text-sm opacity-70">
                    แก้ไขข้อมูลเป้าหมาย
                </p>
            </div>

            <DevelopmentGoalForm initialData={goal} issues={issues} />
        </div>
    );
}
