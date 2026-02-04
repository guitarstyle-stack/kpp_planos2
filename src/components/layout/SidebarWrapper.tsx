"use client";

import { useSidebar } from "@/hooks/useSidebar";
import { SidebarClient } from "./SidebarClient";

interface SidebarWrapperProps {
    menuGroups: Array<{
        label: string;
        items: Array<{
            title: string;
            href: string;
            icon: any;
        }>;
    }>;
}

export function SidebarWrapper({ menuGroups }: SidebarWrapperProps) {
    const { isCollapsed, toggle, isMounted } = useSidebar();

    // Prevent hydration mismatch by not rendering until mounted
    if (!isMounted) {
        return <SidebarClient menuGroups={menuGroups} isCollapsed={false} />;
    }

    return (
        <SidebarClient
            menuGroups={menuGroups}
            isCollapsed={isCollapsed}
            onToggle={toggle}
        />
    );
}
