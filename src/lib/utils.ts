import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CSSProperties } from "react";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Helper to allow CSS variables in React style objects without 'as any'
 */
export interface CSSPropertiesWithVars extends CSSProperties {
    [key: `--${string}`]: string | number | undefined;
}

export function cssVars(vars: Record<`--${string}`, string | number | undefined>): CSSProperties {
    return vars as CSSProperties;
}
