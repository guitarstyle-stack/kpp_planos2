"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faFilter, faTimes } from "@fortawesome/free-solid-svg-icons";
import { searchProjectsAction } from "@/actions/projectActions";

interface ProjectSearchProps {
    departments?: Array<{ id: number; name: string }>;
    years?: number[];
    developmentGoals?: Array<{ id: number; name: string }>;
}

export function ProjectSearch({ departments = [], years = [], developmentGoals = [] }: ProjectSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [showFilters, setShowFilters] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Advanced filters
    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") || "");
    const [fiscalYear, setFiscalYear] = useState(searchParams.get("fiscalYear") || "");
    const [goalId, setGoalId] = useState(searchParams.get("goalId") || "");

    // Debounced search
    const updateURL = useCallback(
        (newQuery: string, filters: Record<string, string>) => {
            const params = new URLSearchParams(searchParams);

            if (newQuery.trim()) {
                params.set("q", newQuery.trim());
            } else {
                params.delete("q");
            }

            // Update filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });

            router.replace(`${pathname}?${params.toString()}`);
        },
        [pathname, router, searchParams]
    );

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            updateURL(query, { status, departmentId, fiscalYear, goalId });
        }, 500);

        return () => clearTimeout(timer);
    }, [query, status, departmentId, fiscalYear, goalId, updateURL]);

    const handleClearSearch = () => {
        setQuery("");
        setStatus("");
        setDepartmentId("");
        setFiscalYear("");
        setGoalId("");
        router.replace(pathname);
    };

    const hasFilters = query || status || departmentId || fiscalYear || goalId;

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <FontAwesomeIcon icon={faSearch} className="h-4 w-4 opacity-50" />
                    </div>
                    <input
                        type="text"
                        className="input input-bordered w-full pl-10 pr-20"
                        placeholder="ค้นหาโครงการ (ชื่อ, รหัส, คำอธิบาย)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        >
                            <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                        </button>
                    )}
                    {isSearching && (
                        <div className="absolute inset-y-0 right-10 flex items-center pr-3">
                            <span className="loading loading-spinner loading-sm"></span>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn ${showFilters ? "btn-primary" : "btn-outline"}`}
                >
                    <FontAwesomeIcon icon={faFilter} className="h-4 w-4" />
                    Filters
                    {hasFilters && !showFilters && (
                        <span className="badge badge-sm badge-error">•</span>
                    )}
                </button>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="btn btn-ghost"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body p-4">
                        <h4 className="font-semibold mb-4 text-sm">ตัวกรองขั้นสูง</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Status Filter */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-xs">สถานะ</span>
                                </label>
                                <select
                                    className="select select-bordered select-sm"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="">ทั้งหมด</option>
                                    <option value="NOT_STARTED">ยังไม่เริ่ม</option>
                                    <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                                    <option value="COMPLETED">เสร็จสิ้น</option>
                                    <option value="CANCELLED">ยกเลิก</option>
                                </select>
                            </div>

                            {/* Department Filter */}
                            {departments.length > 0 && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-xs">หน่วยงาน</span>
                                    </label>
                                    <select
                                        className="select select-bordered select-sm"
                                        value={departmentId}
                                        onChange={(e) => setDepartmentId(e.target.value)}
                                    >
                                        <option value="">ทั้งหมด</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Fiscal Year Filter */}
                            {years.length > 0 && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-xs">ปีงบประมาณ</span>
                                    </label>
                                    <select
                                        className="select select-bordered select-sm"
                                        value={fiscalYear}
                                        onChange={(e) => setFiscalYear(e.target.value)}
                                    >
                                        <option value="">ทั้งหมด</option>
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Development Goal Filter */}
                            {developmentGoals.length > 0 && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-xs">เป้าหมาย</span>
                                    </label>
                                    <select
                                        className="select select-bordered select-sm"
                                        value={goalId}
                                        onChange={(e) => setGoalId(e.target.value)}
                                    >
                                        <option value="">ทั้งหมด</option>
                                        {developmentGoals.map((goal) => (
                                            <option key={goal.id} value={goal.id}>
                                                {goal.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filters Display */}
            {hasFilters && !showFilters && (
                <div className="flex flex-wrap gap-2">
                    {query && (
                        <span className="badge badge-primary gap-2">
                            ค้นหา: {query}
                            <button onClick={() => setQuery("")}>
                                <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {status && (
                        <span className="badge badge-secondary gap-2">
                            สถานะ:{" "}
                            {status === "NOT_STARTED"
                                ? "ยังไม่เริ่ม"
                                : status === "IN_PROGRESS"
                                    ? "กำลังดำเนินการ"
                                    : status === "COMPLETED"
                                        ? "เสร็จสิ้น"
                                        : "ยกเลิก"}
                            <button onClick={() => setStatus("")}>
                                <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {fiscalYear && (
                        <span className="badge badge-accent gap-2">
                            ปี: {fiscalYear}
                            <button onClick={() => setFiscalYear("")}>
                                <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
