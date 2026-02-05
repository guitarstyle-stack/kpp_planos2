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

    return (
        <nav className="btm-nav lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-base-300 bg-base-100 h-16 shadow-lg">
            {navItems.map((item) => {
                const isActive = item.activePatterns.some(pattern => pathname.startsWith(pattern));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex flex-col items-center justify-center gap-1 transition-all duration-200',
                            'min-h-[44px] min-w-[44px]', // Touch target size
                            isActive
                                ? 'text-primary font-bold'
                                : 'text-base-content/60 hover:text-base-content'
                        )}
                    >
                        <FontAwesomeIcon
                            icon={item.icon}
                            className={cn(
                                'transition-all duration-200',
                                isActive ? 'h-6 w-6' : 'h-5 w-5'
                            )}
                        />
                        <span className={cn(
                            'text-[10px] leading-none tracking-wide',
                            isActive ? 'font-bold' : 'font-medium'
                        )}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
