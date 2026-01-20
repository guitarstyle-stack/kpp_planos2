"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/authActions";

interface SidebarClientProps {
    menuItems: Array<{
        title: string;
        href: string;
        icon: any;
    }>;
}

export function SidebarClient({ menuItems }: SidebarClientProps) {
    const pathname = usePathname();

    return (

        <aside className="bg-base-200 text-base-content min-h-screen w-80 p-4 font-header flex flex-col">
            <div className="mb-10 pl-2 flex items-center gap-3">
                <div className="avatar placeholder">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-white text-xl font-black italic">P</span>
                    </div>
                </div>
                <div>
                    <span className="block text-xl font-black bg-gradient-to-r from-base-content to-base-content/60 bg-clip-text text-transparent tracking-tight">
                        PlanOS
                    </span>
                    <span className="block text-[10px] font-bold opacity-40 tracking-[0.2em] uppercase -mt-0.5">
                        Project Platform
                    </span>
                </div>
            </div>

            <ul className="menu w-full p-0 gap-1.5 flex-1">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group",
                                    isActive
                                        ? "bg-base-100 text-primary font-bold shadow-sm ring-1 ring-base-300/50"
                                        : "opacity-60 hover:opacity-100 hover:bg-base-300 font-medium"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                                    isActive ? "bg-primary/10 text-primary" : "text-base-content/40 group-hover:text-base-content"
                                )}>
                                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                                </div>
                                <span className="text-[15px] tracking-wide">{item.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="divider opacity-50 my-6"></div>

            <button
                onClick={() => logoutAction()}
                className="group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-error hover:bg-error/10 w-full"
            >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-error/10 text-error">
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                </div>
                <span className="text-[15px] tracking-wide">ออกจากระบบ</span>
            </button>
        </aside>
    );
}
