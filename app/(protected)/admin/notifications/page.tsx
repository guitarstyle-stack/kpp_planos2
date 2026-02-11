import { requireAdmin } from "@/lib/rbac";
import { NotificationManager } from "@/components/admin/NotificationManager";
import { NotificationAnalytics } from "@/components/admin/NotificationAnalytics";
import { getUsers } from "@/services/userService";
import { getDepartments } from "@/services/masterDataService";
import { getAllNotifications, getTemplates, getNotificationStats, getRoles, getAllSchedules } from "@/services/notificationService";
import { getLineQuota, getLineConsumption } from "@/services/lineService";

export default async function AdminNotificationsPage() {
    await requireAdmin();

    const [users, departments, history, templates, stats, quota, consumption, roles, schedules] = await Promise.all([
        getUsers(),
        getDepartments(),
        getAllNotifications(100), // Increase limit for history
        getTemplates(),
        getNotificationStats(),
        getLineQuota(),
        getLineConsumption(),
        getRoles(),
        getAllSchedules(),
    ]);

    const lineStats = quota ? {
        type: quota.type,
        value: quota.value,
        totalUsage: consumption?.totalUsage || 0
    } : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">ระบบจัดการการแจ้งเตือน</h1>
                <p className="text-sm opacity-70">
                    ส่งข้อความแจ้งเตือนผลักดันผ่าน LINE Official Account (Flex Message Support)
                </p>
            </div>

            <NotificationAnalytics stats={stats} lineQuota={lineStats} />

            <NotificationManager
                users={users}
                departments={departments}
                roles={roles}
                history={history}
                templates={templates}
                schedules={schedules}
            />
        </div>
    );
}
