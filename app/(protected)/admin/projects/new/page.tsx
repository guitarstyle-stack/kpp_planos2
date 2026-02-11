import { getDepartments } from "@/services/masterDataService";
import { getAnnualPlans } from "@/services/developmentPlanService";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { AdminProjectFormClient } from "@/components/projects/AdminProjectFormClient";
import db from "@/lib/db";

export default async function AdminNewProjectPage() {
    const session = await getSession();
    const isUserAdmin = await isAdmin();

    if (!session || !isUserAdmin) {
        redirect("/dashboard");
    }

    const allDepartments = await getDepartments();
    const annualPlans = await getAnnualPlans();

    // ดึงข้อมูลผู้ใช้ทั้งหมด สำหรับเลือกผู้รับผิดชอบ
    const allUsers = await db.user.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            departmentId: true,
            department: {
                select: {
                    id: true,
                    name: true,
                }
            }
        },
        orderBy: [
            { departmentId: 'asc' },
            { name: 'asc' }
        ]
    });

    const masterData = {
        departments: allDepartments,
        annualPlans,
        users: allUsers, // เพิ่มข้อมูลผู้ใช้
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    สร้างโครงการใหม่ (Admin)
                </h1>
                <p className="text-sm opacity-70">
                    กรอกข้อมูลเพื่อสร้างโครงการใหม่ในระบบ (สามารถเลือกหน่วยงานและผู้รับผิดชอบได้ทุกหน่วยงาน)
                </p>
            </div>

            <AdminProjectFormClient
                masterData={masterData}
                userId={session?.user?.id || 1}
            />
        </div>
    );
}
