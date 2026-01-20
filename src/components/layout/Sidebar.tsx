import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartPie,
    faFolderOpen,
    faFileAlt,
    faUsers,
    faCog,
    faUser,
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
                {
                    title: "โปรไฟล์",
                    href: "/settings/profile",
                    icon: faUser,
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
            ]
        });
    }

    return menuGroups;
}

export async function Sidebar() {
    const menuGroups = await getMenuItems();

    return <SidebarClient menuGroups={menuGroups} />;
}
