import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartPie,
    faFolderOpen,
    faFileAlt,
    faUsers,
    faCog,
    faUser,
    faBullhorn,
    faEnvelope,
    faShieldAlt,
    faScroll,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { isAdmin, isSysAdmin } from "@/lib/rbac";
import { SidebarWrapper } from "./SidebarWrapper";

async function getMenuItems() {
    const admin = await isAdmin();
    const sysAdmin = await isSysAdmin();

    const menuGroups = [
        {
            label: "เมนูหลัก",
            items: [
                {
                    title: "ภาพรวม",
                    href: "/dashboard",
                    icon: faChartPie,
                },
                {
                    title: "ข่าวประชาสัมพันธ์",
                    href: "/announcements",
                    icon: faBullhorn,
                },
                {
                    title: "โครงการ",
                    href: "/projects",
                    icon: faFolderOpen,
                },
                {
                    title: "รายงาน",
                    href: "/reports",
                    icon: faFileAlt,
                },
                {
                    title: "ข้อความ",
                    href: "/conversations",
                    icon: faEnvelope,
                },
                {
                    title: "รายงานอัพเดท",
                    href: "/updates",
                    icon: faScroll,
                },
            ]
        }
    ];

    if (admin) {
        menuGroups.push({
            label: "การจัดการระบบ",
            items: [
                {
                    title: "ผู้ใช้งาน",
                    href: "/users",
                    icon: faUsers,
                },
                {
                    title: "ตั้งค่า",
                    href: "/settings",
                    icon: faCog,
                },
                {
                    title: "จัดการโครงการ",
                    href: "/admin/projects",
                    icon: faFolderOpen,
                },
                {
                    title: "จัดการแจ้งเตือน",
                    href: "/admin/notifications",
                    icon: faBullhorn,
                },
                {
                    title: "จัดการข้อความ",
                    href: "/admin/conversations",
                    icon: faEnvelope,
                },
            ]
        });
    }

    if (sysAdmin) {
        menuGroups.push({
            label: "ความปลอดภัย",
            items: [
                {
                    title: "ประวัติการใช้งาน",
                    href: "/admin/audit-logs",
                    icon: faShieldAlt,
                },
            ]
        });
    }

    return menuGroups;
}

export async function Sidebar() {
    const menuGroups = await getMenuItems();

    return <SidebarWrapper menuGroups={menuGroups} />;
}
