import { DepartmentForm } from "@/components/settings/DepartmentForm";
import db from "@/lib/db";
import { notFound } from "next/navigation";
import { getDepartmentTypes } from "@/services/masterDataService";

export default async function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [department, departmentTypes] = await Promise.all([
        db.department.findUnique({
            where: { id: Number(id) },
        }),
        getDepartmentTypes()
    ]);

    if (!department) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    แก้ไขข้อมูลหน่วยงาน
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    แก้ไขรายละเอียดหน่วยงาน
                </p>
            </div>

            <DepartmentForm initialData={department} departmentTypes={departmentTypes} />
        </div>
    );
}
