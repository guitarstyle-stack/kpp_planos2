"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

interface DepartmentFilterFormProps {
    departmentTypes: { id: number; name: string }[];
}

export function DepartmentFilterForm({ departmentTypes }: DepartmentFilterFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [q, setQ] = useState(searchParams.get("q") || "");
    const [type, setType] = useState(searchParams.get("type") || "");

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let path = "/settings/departments";
        const query = [];
        
        if (q) query.push(`q=${encodeURIComponent(q)}`);
        if (type) query.push(`type=${encodeURIComponent(type)}`);
        
        if (query.length > 0) {
            path += `?${query.join("&")}`;
        }
        
        router.push(path);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 mb-6 font-sans">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="form-control w-full md:w-1/3">
                    <label className="label">
                        <span className="label-text font-medium">ค้นหา</span>
                    </label>
                    <input
                        type="text"
                        placeholder="รหัส หรือ ชื่อหน่วยงาน..."
                        className="input input-bordered w-full"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>
                
                <div className="form-control w-full md:w-1/3">
                    <label className="label">
                        <span className="label-text font-medium">ประเภทหน่วยงาน</span>
                    </label>
                    <select
                        className="select select-bordered w-full"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">ทั้งหมด</option>
                        {departmentTypes.map((t) => (
                            <option key={t.id} value={t.id.toString()}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="form-control w-full md:w-auto mt-4 md:mt-0">
                    <button type="submit" className="btn btn-primary gap-2 w-full">
                        <FontAwesomeIcon icon={faSearch} />
                        ค้นหา
                    </button>
                </div>
            </div>
        </form>
    );
}
