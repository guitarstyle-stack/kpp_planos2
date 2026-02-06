"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/authActions";

interface SidebarClientProps {
    menuGroups: Array<{
        label: string;
        items: Array<{
            title: string;
            href: string;
            icon: any;
        }>;
    }>;
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export function SidebarClient({ menuGroups, isCollapsed = false, onToggle }: SidebarClientProps) {
    const pathname = usePathname();

    return (
        <aside className={cn(
            "bg-base-200 text-base-content min-h-screen p-4 font-header flex flex-col transition-all duration-300 relative",
            isCollapsed ? "w-20" : "w-80"
        )}>
            {/* Logo */}
            <div className={cn(
                "mb-10 flex items-center gap-3 transition-all duration-300",
                isCollapsed ? "justify-center px-0" : "pl-2"
            )}>
                <div className="avatar placeholder">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-white text-xl font-black italic">P</span>
                    </div>
                </div>
                {!isCollapsed && (
                    <div className="overflow-hidden">
                        <span className="block text-xl font-black bg-gradient-to-r from-base-content to-base-content/60 bg-clip-text text-transparent tracking-tight">
                            PlanOS
                        </span>
                        <span className="block text-[10px] font-bold opacity-40 tracking-[0.2em] uppercase -mt-0.5">
                            Project Platform
                        </span>
                    </div>
                )}
            </div>

            {/* Menu Groups */}
            <div className="flex-1 overflow-y-auto space-y-8">
                {menuGroups.map((group) => (
                    <div key={group.label} className="space-y-3">
                        {!isCollapsed && (
                            <div className="px-4 text-[11px] font-black uppercase tracking-[0.2em] opacity-30">
                                {group.label}
                            </div>
                        )}
                        <ul className={cn("menu w-full p-0", isCollapsed ? "gap-2" : "gap-1.5")}>
                            {group.items.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center rounded-xl transition-all duration-300 group tooltip tooltip-right",
                                                isCollapsed ? "px-3 py-3 justify-center" : "gap-3.5 px-4 py-3",
                                                isActive
                                                    ? "bg-base-100 text-primary font-bold shadow-sm ring-1 ring-base-300/50"
                                                    : "opacity-60 hover:opacity-100 hover:bg-base-300 font-medium"
                                            )}
                                            data-tip={isCollapsed ? item.title : undefined}
                                        >
                                            <div className={cn(
                                                "rounded-lg flex items-center justify-center transition-all duration-300",
                                                isCollapsed ? "w-6 h-6" : "w-8 h-8",
                                                isActive ? "bg-primary/10 text-primary" : "text-base-content/40 group-hover:text-base-content"
                                            )}>
                                                <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                                            </div>
                                            {!isCollapsed && (
                                                <span className="text-[15px] tracking-wide whitespace-nowrap overflow-hidden">
                                                    {item.title}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Toggle Button - Desktop only (Centered Edge Position) */}
            {onToggle && (
                <button
                    onClick={onToggle}
                    className={cn(
                        "absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 hidden lg:flex",
                        "btn btn-circle btn-xs bg-base-100 border-base-300 hover:bg-primary hover:text-white shadow-lg transition-all duration-300 group"
                    )}
                    aria-label={isCollapsed ? "ขยาย sidebar" : "ย่อ sidebar"}
                >
                    <FontAwesomeIcon
                        icon={isCollapsed ? faChevronRight : faChevronLeft}
                        className="w-2.5 h-2.5 transition-transform group-hover:scale-125"
                    />
                </button>
            )}
        </aside>
    );
}
