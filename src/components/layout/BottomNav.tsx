'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHome,
    faFolderOpen,
    faChartLine,
    faComments,
    faUser
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const navItems = [
    {
        icon: faHome,
        label: 'หน้าหลัก',
        href: '/dashboard',
        activePatterns: ['/dashboard']
    },
    {
        icon: faFolderOpen,
        label: 'โครงการ',
        href: '/projects',
        activePatterns: ['/projects']
    },
    {
        icon: faChartLine,
        label: 'รายงาน',
        href: '/reports',
        activePatterns: ['/reports']
    },
    {
        icon: faComments,
        label: 'แชท',
        href: '/conversations',
        activePatterns: ['/conversations']
    },
    {
        icon: faUser,
        label: 'โปรไฟล์',
        href: '/profile',
        activePatterns: ['/profile', '/settings/profile']
    },
];

export function BottomNav() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-base-300 bg-base-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
            suppressHydrationWarning
        >
            <div className="flex items-center justify-between h-16 max-w-md mx-auto px-2">
                {navItems.map((item) => {
                    const isActive = mounted && item.activePatterns.some(pattern => pathname.startsWith(pattern));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 transition-all duration-300 relative',
                                'min-h-[48px] min-w-[48px] pt-1', // Touch target size + vertical alignment
                                isActive
                                    ? 'text-primary'
                                    : 'text-base-content/50'
                            )}
                            suppressHydrationWarning
                        >
                            <div className={cn(
                                "flex items-center justify-center transition-all duration-300",
                                isActive ? "mb-0.5" : "mb-0"
                            )}>
                                <FontAwesomeIcon
                                    icon={item.icon}
                                    className={cn(
                                        'transition-all duration-300',
                                        isActive ? 'h-[22px] w-[22px]' : 'h-[20px] w-[20px]'
                                    )}
                                />
                            </div>
                            <span className={cn(
                                'text-[10.5px] leading-tight transition-all duration-300 mt-0.5',
                                isActive ? 'font-bold' : 'font-medium'
                            )}>
                                {item.label}
                            </span>

                            {/* Active indicator bar */}
                            {isActive && (
                                <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full"></div>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
