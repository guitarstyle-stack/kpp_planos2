import { getCurrentUser } from "@/lib/rbac";
import { getDepartments } from "@/services/departmentService";
import { UserEditForm } from "@/components/users/UserEditForm";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const departments = await getDepartments();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    ข้อมูลส่วนตัว
                </h1>
                <p className="text-sm opacity-70">
                    แก้ไขข้อมูลส่วนตัวและตั้งค่าบัญชีของคุณ
                </p>
            </div>

            <UserEditForm user={user} departments={departments} />

            <div className="alert alert-warning shadow-sm">
                <span className="text-xl">ℹ️</span>
                <div>
                    <h3 className="font-bold">หมายเหตุ:</h3>
                    <ul className="list-disc list-inside text-sm">
                        <li>การเปลี่ยนแปลงข้อมูลจะมีผลทันที</li>
                        <li>หากต้องการเปลี่ยนสิทธิ์การใช้งาน กรุณาติดต่อผู้ดูแลระบบ</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
