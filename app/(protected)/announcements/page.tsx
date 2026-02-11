import { getNotifications, markAsRead } from "@/services/notificationService";
import { getSession } from "@/lib/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn, faClock, faLink, faInfoCircle, faExclamationTriangle, faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
    const session = await getSession();
    if (!session?.user) return null;

    // Fetch all notifications (limit 50 per page for now)
    const notifications = await getNotifications(session.user.id, 50);

    // Group by date (Today, Yesterday, Older)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
        today: notifications.filter(n => new Date(n.createdAt) >= today),
        yesterday: notifications.filter(n => {
            const d = new Date(n.createdAt);
            return d >= yesterday && d < today;
        }),
        older: notifications.filter(n => new Date(n.createdAt) < yesterday),
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "WARNING": return <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning h-5 w-5" />;
            case "SUCCESS": return <FontAwesomeIcon icon={faCheckCircle} className="text-success h-5 w-5" />;
            case "ERROR": return <FontAwesomeIcon icon={faExclamationCircle} className="text-error h-5 w-5" />;
            default: return <FontAwesomeIcon icon={faInfoCircle} className="text-info h-5 w-5" />;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
                    <FontAwesomeIcon icon={faBullhorn} className="h-8 w-8" />
                    ข่าวประชาสัมพันธ์
                </h1>
                <p className="text-sm opacity-70">
                    ประกาศและแจ้งเตือนทั้งหมดจากระบบ PlanOS
                </p>
            </div>

            <div className="space-y-8">
                {groups.today.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            วันนี้
                        </h2>
                        <div className="space-y-4">
                            {groups.today.map(n => <AnnouncementCard key={n.id} notification={n} icon={getIcon(n.type)} />)}
                        </div>
                    </section>
                )}

                {groups.yesterday.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 opacity-70">
                            <span className="w-2 h-2 rounded-full bg-base-content/30"></span>
                            เมื่อวานนี้
                        </h2>
                        <div className="space-y-4 opacity-90">
                            {groups.yesterday.map(n => <AnnouncementCard key={n.id} notification={n} icon={getIcon(n.type)} />)}
                        </div>
                    </section>
                )}

                {groups.older.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 opacity-50">
                            <span className="w-2 h-2 rounded-full bg-base-content/20"></span>
                            เก่ากว่านั้น
                        </h2>
                        <div className="space-y-4 opacity-75">
                            {groups.older.map(n => <AnnouncementCard key={n.id} notification={n} icon={getIcon(n.type)} />)}
                        </div>
                    </section>
                )}

                {notifications.length === 0 && (
                    <div className="text-center py-20 text-base-content/50 bg-base-200/50 rounded-box border border-base-200 border-dashed">
                        <FontAwesomeIcon icon={faBullhorn} className="h-12 w-12 mb-4 opacity-20" />
                        <p>ยังไม่มีประกาศข่าวในขณะนี้</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function AnnouncementCard({ notification, icon }: { notification: any, icon: React.ReactNode }) {
    const isLink = !!notification.link;

    const Content = () => (
        <div className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 ${!notification.isRead ? 'border-l-4 border-l-primary' : ''}`}>
            <div className="card-body p-5">
                <div className="flex gap-4 items-start">
                    <div className="mt-1 flex-shrink-0">
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-bold text-lg leading-tight">
                            {notification.title}
                        </h3>
                        <p className="text-base-content/80 whitespace-pre-wrap leading-relaxed">
                            {notification.message}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-base-content/50 pt-2">
                            <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faClock} />
                                {format(new Date(notification.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                            </span>
                            {notification.link && (
                                <span className="flex items-center gap-1 text-primary">
                                    <FontAwesomeIcon icon={faLink} />
                                    เปิดลิงก์แนบ
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isLink) {
        return (
            <Link href={notification.link} target="_blank" className="block transform hover:-translate-y-0.5 transition-transform">
                <Content />
            </Link>
        );
    }

    return <Content />;
}
