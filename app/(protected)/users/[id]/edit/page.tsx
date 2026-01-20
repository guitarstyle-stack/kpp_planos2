import { getUserById } from "@/services/userService";
import { getDepartments } from "@/services/departmentService";
import { getRoles } from "@/services/userRoleService";
import { UserEditForm } from "@/components/users/UserEditForm";
import { UserRoleManagement } from "@/components/users/UserRoleManagement";
import { notFound } from "next/navigation";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = parseInt(id);

    const [user, departments, roles] = await Promise.all([
        getUserById(userId),
        getDepartments(),
        getRoles(),
    ]);

    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    แก้ไขข้อมูลผู้ใช้งาน
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    จัดการข้อมูลและสิทธิ์การใช้งานของ {user.name}
                </p>
            </div>

            <UserEditForm user={user} departments={departments} />

            <UserRoleManagement user={user} availableRoles={roles} />
        </div>
    );
}
