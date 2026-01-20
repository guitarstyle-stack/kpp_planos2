import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { getUsers, getRoles } from "@/services/userService";
import { getDepartments } from "@/services/masterDataService";
import { UsersClient } from "@/components/users/UsersClient";

export default async function UsersPage() {
    // Require admin access
    try {
        await requireAdmin();
    } catch {
        redirect("/profile"); // Redirect non-admins to their profile
    }

    const [users, departments, roles] = await Promise.all([
        getUsers(),
        getDepartments(),
        getRoles(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        จัดการผู้ใช้งาน
                    </h1>
                    <p className="text-sm opacity-70">
                        บริหารจัดการข้อมูลผู้ใช้, สิทธิ์การใช้งาน และสังกัดหน่วยงาน
                    </p>
                </div>
            </div>

            <UsersClient users={users} departments={departments} roles={roles} />
        </div>
    );
}

