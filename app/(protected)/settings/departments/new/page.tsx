import { DepartmentForm } from "@/components/settings/DepartmentForm";
import { getDepartmentTypes } from "@/services/masterDataService";

export default async function NewDepartmentPage() {
    const departmentTypes = await getDepartmentTypes();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    เพิ่มหน่วยงานใหม่
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    สร้างหน่วยงานใหม่ในระบบ
                </p>
            </div>

            <DepartmentForm departmentTypes={departmentTypes} />
        </div>
    );
}

