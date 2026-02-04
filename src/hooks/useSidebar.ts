"use client";

import { useState, useEffect } from "react";

export function useSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("sidebar-collapsed");
        if (stored !== null) {
            setIsCollapsed(stored === "true");
        }
    }, []);

    const toggle = () => {
        setIsCollapsed((prev) => {
            const newValue = !prev;
            localStorage.setItem("sidebar-collapsed", String(newValue));
            return newValue;
        });
    };

    return { isCollapsed, toggle, isMounted };
}
