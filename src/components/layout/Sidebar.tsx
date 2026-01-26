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
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/lib/rbac";
import { SidebarClient } from "./SidebarClient";

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
            ]
        });
    }

    return menuGroups;
}

export async function Sidebar() {
    const menuGroups = await getMenuItems();

    return <SidebarClient menuGroups={menuGroups} />;
}
