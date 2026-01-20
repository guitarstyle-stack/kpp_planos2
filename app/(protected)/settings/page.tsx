import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faLayerGroup, faShieldAlt } from "@fortawesome/free-solid-svg-icons";

const settingMenus = [
    {
        title: "หน่วยงาน",
        description: "จัดการข้อมูลหน่วยงานภายในองค์กร",
        href: "/settings/departments",
        icon: faBuilding,
        color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
        title: "แผนยุทธศาสตร์ (Strategic Plans)",
        description: "จัดการแผนพัฒนาสังคม ประเด็น เป้าหมาย และตัวชี้วัด",
        href: "/settings/strategic-plan",
        icon: faLayerGroup,
        color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    {
        title: "การจัดการสิทธิ์ (Roles)",
        description: "จัดการบทบาท สิทธิ์การใช้งาน และกำหนดสิทธิ์ผู้ใช้",
        href: "/settings/roles",
        icon: faShieldAlt,
        color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    ตั้งค่าระบบ
                </h1>
                <p className="text-sm opacity-70">
                    จัดการข้อมูลพื้นฐานและ Master Data ของระบบ
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {settingMenus.map((menu) => (
                    <Link
                        key={menu.href}
                        href={menu.href}
                        className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-all hover:-translate-y-1"
                    >
                        <div className="card-body p-6">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4`}>
                                <FontAwesomeIcon icon={menu.icon} className="h-6 w-6" />
                            </div>
                            <h3 className="card-title text-base">
                                {menu.title}
                            </h3>
                            <p className="text-sm opacity-70">
                                {menu.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
