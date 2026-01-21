import { requireAdmin } from "@/lib/rbac";
import { NotificationManager } from "@/components/admin/NotificationManager";
import { NotificationAnalytics } from "@/components/admin/NotificationAnalytics";
import { getUsers } from "@/services/userService";
import { getDepartments } from "@/services/masterDataService";
import { getAllNotifications, getTemplates, getNotificationStats } from "@/services/notificationService";

export default async function AdminNotificationsPage() {
    await requireAdmin();

    const [users, departments, history, templates, stats] = await Promise.all([
        getUsers(),
        getDepartments(),
        getAllNotifications(20),
        getTemplates(),
        getNotificationStats(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">ระบบจัดการการแจ้งเตือน</h1>
                <p className="text-sm opacity-70">
                    ส่งข้อความแจ้งเตือนผลักดันผ่าน LINE Official Account (Flex Message Support)
                </p>
            </div>

            <NotificationAnalytics stats={stats} />

            <NotificationManager
                users={users}
                departments={departments}
                history={history}
                templates={templates}
            />
        </div>
    );
}
