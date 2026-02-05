'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PullToRefreshWrapperProps {
    children: React.ReactNode;
}

export function PullToRefreshWrapper({ children }: PullToRefreshWrapperProps) {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startY = useRef(0);
    const isAtTop = useRef(true);
    const router = useRouter();

    const PULL_THRESHOLD = 80; // pixels to pull before refreshing

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            // Check if we're at the top of the page
            isAtTop.current = window.scrollY === 0;
            if (isAtTop.current) {
                startY.current = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isAtTop.current || !startY.current) return;

            const currentY = e.touches[0].clientY;
            const distance = currentY - startY.current;

            // Only pull down, not up
            if (distance > 0) {
                // Prevent default scroll behavior
                e.preventDefault();
                setIsPulling(true);
                // Apply elastic effect (diminishing returns as you pull)
                setPullDistance(Math.min(distance * 0.5, PULL_THRESHOLD * 1.2));
            }
        };

        const handleTouchEnd = async () => {
            if (isPulling && pullDistance >= PULL_THRESHOLD) {
                // Trigger refresh
                router.refresh();

                // Optional: Add a small delay for visual feedback
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            setIsPulling(false);
            setPullDistance(0);
            startY.current = 0;
        };

        // Add touch listeners
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, pullDistance, router]);

    return (
        <div className="relative">
            {/* Pull indicator */}
            {isPulling && (
                <div
                    className="fixed top-0 left-0 right-0 flex items-center justify-center bg-base-200/90 backdrop-blur-sm transition-all duration-200 ease-out z-50"
                    style={{
                        height: `${pullDistance}px`,
                        opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
                    }}
                >
                    <div className="flex items-center gap-2">
                        {pullDistance >= PULL_THRESHOLD ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span className="text-sm font-medium">ปล่อยเพื่อรีเฟรช...</span>
                            </>
                        ) : (
                            <span className="text-sm font-medium">ดึงลงเพื่อรีเฟรช...</span>
                        )}
                    </div>
                </div>
            )}

            {/* Content with pull offset */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isPulling ? 'none' : 'transform 0.3s ease-out'
                }}
            >
                {children}
            </div>
        </div>
    );
}
