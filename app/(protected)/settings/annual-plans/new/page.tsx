import { AnnualPlanForm } from "@/components/settings/AnnualPlanForm";

export default function NewAnnualPlanPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    สร้างแผนพัฒนาสังคมประจำปี
                </h1>
                <p className="text-sm opacity-70">
                    กรอกข้อมูลเพื่อสร้างแผนพัฒนาสังคมใหม่
                </p>
            </div>

            <AnnualPlanForm />
        </div>
    );
}
