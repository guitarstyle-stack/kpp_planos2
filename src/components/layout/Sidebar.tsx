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
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/lib/rbac";
import { SidebarWrapper } from "./SidebarWrapper";

async function getMenuItems() {
    const admin = await isAdmin();

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

    return menuGroups;
}

export async function Sidebar() {
    const menuGroups = await getMenuItems();

    return <SidebarWrapper menuGroups={menuGroups} />;
}
