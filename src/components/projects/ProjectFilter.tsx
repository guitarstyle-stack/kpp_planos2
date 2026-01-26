"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

interface ProjectFilterProps {
    years: number[];
}

export function ProjectFilter({ years }: ProjectFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentYear = searchParams.get("fiscalYear");

    function handleYearChange(year: string) {
        const params = new URLSearchParams(searchParams);
        if (year) {
            params.set("fiscalYear", year);
        } else {
            params.delete("fiscalYear");
        }

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }

    return (
        <select
            className="select select-bordered select-sm w-full max-w-xs"
            value={currentYear || ""}
            onChange={(e) => handleYearChange(e.target.value)}
            disabled={isPending}
        >
            <option value="">ทุกปีงบประมาณ</option>
            {years.map((year) => (
                <option key={year} value={year}>
                    ปีงบประมาณ {year}
                </option>
            ))}
        </select>
    );
}
