import { requireAdmin } from "@/lib/rbac";
import { NotificationManager } from "@/components/admin/NotificationManager";
import { getUsers } from "@/services/userService";
import { getDepartments } from "@/services/masterDataService";
import { getAllNotifications } from "@/services/notificationService";

export default async function AdminNotificationsPage() {
    await requireAdmin();

    const [users, departments, history] = await Promise.all([
        getUsers(),
        getDepartments(),
        getAllNotifications(20),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">ระบบจัดการการแจ้งเตือน</h1>
                <p className="text-sm opacity-70">
                    ส่งข้อความแจ้งเตือนถึงผู้ใช้งานผ่านหน้าเว็บและ LINE Official Account
                </p>
            </div>

            <NotificationManager
                users={users}
                departments={departments}
                history={history}
            />
        </div>
    );
}
