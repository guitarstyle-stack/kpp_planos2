"use client";

import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faSearch, faBell, faChevronDown, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { NotificationBell } from "./NotificationBell";
import Image from "next/image";
import Link from "next/link";

interface NavbarProps {
    userId?: number;
    userName?: string;
    userImage?: string | null;
}

export function Navbar({ userId, userName, userImage }: NavbarProps) {
    const pathname = usePathname();

    const getPageTitle = (path: string) => {
        if (path === "/dashboard") return "ภาพรวมระบบ";
        if (path === "/projects") return "โครงการทั้งหมด";
        if (path === "/projects/new") return "สร้างโครงการใหม่";
        if (path.startsWith("/projects/")) return "รายละเอียดโครงการ";
        if (path === "/reports") return "รายงานสรุป";
        if (path === "/users") return "จัดการผู้ใช้งาน";
        if (path === "/settings") return "ตั้งค่าระบบ";
        if (path === "/settings/profile") return "โปรไฟล์ส่วนตัว";
        if (path === "/settings/roles") return "จัดการสิทธิ์การใช้งาน";
        if (path === "/settings/strategic-plan") return "แผนยุทธศาสตร์";
        return "Dashboard";
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "สวัสดีตอนเช้า";
        if (hour < 17) return "สวัสดีตอนบ่าย";
        return "สวัสดีตอนเย็น";
    };

    return (
        <div className="navbar bg-base-100/95 backdrop-blur-xl border-b border-base-200/50 sticky top-0 z-40 px-4 md:px-8 h-18 transition-all duration-300">
            {/* Left: Hamburger & Title */}
            <div className="navbar-start gap-4">
                <label htmlFor="main-drawer" className="btn btn-ghost btn-circle lg:hidden hover:bg-base-200">
                    <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
                </label>

                <div className="hidden md:flex flex-col">
                    <h1 className="font-display font-bold text-xl bg-gradient-to-r from-base-content to-base-content/60 bg-clip-text text-transparent leading-tight">
                        {getPageTitle(pathname)}
                    </h1>
                    <span className="text-xs text-base-content/40 font-medium">
                        {new Date().toLocaleDateString("th-TH", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Center: Search (Optional, hidden on small) */}
            <div className="navbar-center hidden lg:flex">
                <div className="relative w-96 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-base-content/30 group-focus-within:text-primary transition-colors">
                        <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาเมนู, โครงการ หรือเอกสาร..."
                        className="input input-sm w-full pl-11 bg-base-200/50 border-transparent focus:bg-base-100 focus:border-primary/20 focus:shadow-lg focus:shadow-primary/5 transition-all rounded-full"
                    />
                    <div className="absolute right-3 top-1.5 hidden group-focus-within:flex">
                        <kbd className="kbd kbd-sm h-5 text-[10px] bg-base-100 border-base-300">⌘</kbd>
                        <kbd className="kbd kbd-sm h-5 text-[10px] bg-base-100 border-base-300 ml-1">K</kbd>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="navbar-end gap-2 md:gap-4">
                {userId && <NotificationBell userId={userId} />}

                <div className="h-8 w-[1px] bg-base-300 mx-1 hidden md:block"></div>

                <Link href="/settings/profile" className="btn btn-ghost btn-md gap-3 px-2 md:px-4 rounded-full hover:bg-base-200/50 group transition-all">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-semibold group-hover:text-primary transition-colors">
                            {userName || "ผู้ใช้งาน"}
                        </div>
                        <div className="text-[10px] text-base-content/50 uppercase tracking-wider font-bold">
                            {getGreeting()}
                        </div>
                    </div>
                    <div className="avatar ring-2 ring-base-200 ring-offset-2 ring-offset-base-100 rounded-full transition-all group-hover:ring-primary/30">
                        <div className="w-9 h-9 mask mask-circle">
                            {userImage ? (
                                <Image src={userImage} alt="Profile" width={36} height={36} unoptimized />
                            ) : (
                                <div className="bg-primary/10 text-primary w-full h-full flex items-center justify-center font-bold text-sm">
                                    {(userName?.[0] || "U").toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-all hidden md:block" />
                </Link>
            </div>
        </div>
    );
}
