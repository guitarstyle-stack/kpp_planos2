"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterOption {
    id: number;
    name: string;
}

interface DashboardFiltersProps {
    years: number[];
    departments: FilterOption[];
    issues: FilterOption[];
}

export function DashboardFilters({ years, departments, issues }: DashboardFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Helper to create a new query string with updated params
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== "") {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleFilterChange = (name: string, value: string) => {
        router.push(`?${createQueryString(name, value)}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
            {/* Fiscal Year Filter */}
            <div className="form-control w-full sm:w-auto min-w-[150px]">
                <label className="label py-1">
                    <span className="label-text text-xs opacity-70">ปีงบประมาณ</span>
                </label>
                <select
                    className="select select-bordered select-sm w-full"
                    value={searchParams.get("fiscalYear") || ""}
                    onChange={(e) => handleFilterChange("fiscalYear", e.target.value)}
                >
                    <option value="">ทั้งหมด</option>
                    {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Department Filter */}
            <div className="form-control w-full sm:w-auto min-w-[200px]">
                <label className="label py-1">
                    <span className="label-text text-xs opacity-70">หน่วยงาน</span>
                </label>
                <select
                    className="select select-bordered select-sm w-full"
                    value={searchParams.get("departmentId") || ""}
                    onChange={(e) => handleFilterChange("departmentId", e.target.value)}
                >
                    <option value="">ทั้งหมด</option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
            </div>

            {/* Development Issue Filter */}
            <div className="form-control w-full sm:w-auto min-w-[200px] flex-1">
                <label className="label py-1">
                    <span className="label-text text-xs opacity-70">ประเด็นการพัฒนา</span>
                </label>
                <select
                    className="select select-bordered select-sm w-full"
                    value={searchParams.get("issueId") || ""}
                    onChange={(e) => handleFilterChange("issueId", e.target.value)}
                >
                    <option value="">ทั้งหมด</option>
                    {issues.map((issue) => (
                        <option key={issue.id} value={issue.id}>{issue.name}</option>
                    ))}
                </select>
            </div>

            {/* Clear Filters Button */}
            {(searchParams.get("fiscalYear") || searchParams.get("departmentId") || searchParams.get("issueId")) && (
                <div className="flex items-end pb-1">
                    <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => router.push("/dashboard")}
                    >
                        ล้างตัวกรอง
                    </button>
                </div>
            )}
        </div>
    );
}
