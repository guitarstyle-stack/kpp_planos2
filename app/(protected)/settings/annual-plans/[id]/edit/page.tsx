import { notFound } from "next/navigation";
import db from "@/lib/db";
import { AnnualPlanForm } from "@/components/settings/AnnualPlanForm";

export default async function EditAnnualPlanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const plan = await db.annualPlan.findUnique({
        where: { id: Number(id) },
    });

    if (!plan) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    แก้ไขแผนพัฒนาสังคมประจำปี
                </h1>
                <p className="text-sm opacity-70">
                    แก้ไขข้อมูลแผนพัฒนาสังคม
                </p>
            </div>

            <AnnualPlanForm initialData={plan} />
        </div>
    );
}
