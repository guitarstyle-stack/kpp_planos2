"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuditLogsAction, GetAuditLogsParams } from "@/actions/auditLogActions";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import { FaSearch, FaHistory, FaCode, FaUser } from "react-icons/fa";

export default function AuditLogTable() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [params, setParams] = useState<GetAuditLogsParams>({
        page: 1,
        pageSize: 20,
    });
    const [metadata, setMetadata] = useState<any>({
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
    });

    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAuditLogsAction(params);
            if (res.success) {
                setLogs(res.data || []);
                setMetadata(res.metadata);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setParams(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const handleFilterChange = (key: string, value: string) => {
        setParams(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "CREATE": return "badge-success";
            case "UPDATE": return "badge-warning";
            case "DELETE": return "badge-error";
            case "LOGIN": return "badge-info";
            default: return "badge-ghost";
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-4">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="form-control">
                            <label className="label label-text text-xs">Entity Type</label>
                            <input
                                type="text"
                                className="input input-sm input-bordered"
                                placeholder="e.g. Project"
                                value={params.entityType || ""}
                                onChange={(e) => handleFilterChange("entityType", e.target.value)}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label label-text text-xs">Action</label>
                            <select
                                className="select select-sm select-bordered"
                                value={params.action || ""}
                                onChange={(e) => handleFilterChange("action", e.target.value)}
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="LOGIN">LOGIN</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label label-text text-xs">Date Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    className="input input-sm input-bordered w-full"
                                    value={params.startDate || ""}
                                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-control">
                            <button type="button" onClick={() => fetchLogs()} className="btn btn-sm btn-primary w-full">
                                <FaSearch className="mr-2" /> Refresh
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Table */}
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-sm md:table-md w-full">
                        <thead className="bg-base-200">
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Description</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-base-content/50">
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-base-content/50">
                                        No audit logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-base-50">
                                        <td className="whitespace-nowrap font-mono text-xs">
                                            {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: th })}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {log.user?.image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={log.user.image} alt="" className="w-5 h-5 rounded-full" />
                                                ) : (
                                                    <FaUser className="w-4 h-4 text-base-content/30" />
                                                )}
                                                <span className="text-xs truncate max-w-[120px]" title={log.user?.name}>
                                                    {log.user?.name || "System"}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-xs text-[10px] font-bold ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs">{log.entityType}</span>
                                                <span className="text-[10px] text-base-content/50">ID: {log.entityId}</span>
                                            </div>
                                        </td>
                                        <td className="max-w-xs truncate text-xs" title={log.description || ""}>
                                            {log.description || "-"}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-xs text-primary"
                                                onClick={() => setSelectedLog(log)}
                                                disabled={!log.diffBefore && !log.diffAfter}
                                            >
                                                <FaCode /> Diff
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center p-4 border-t border-base-200">
                    <span className="text-xs text-base-content/70">
                        Page {metadata.page} of {metadata.totalPages} ({metadata.totalCount} logs)
                    </span>
                    <div className="join">
                        <button
                            className="join-item btn btn-xs"
                            disabled={metadata.page <= 1}
                            onClick={() => setParams(prev => ({ ...prev, page: prev.page! - 1 }))}
                        >
                            «
                        </button>
                        <button className="join-item btn btn-xs pointer-events-none">
                            {metadata.page}
                        </button>
                        <button
                            className="join-item btn btn-xs"
                            disabled={metadata.page >= metadata.totalPages}
                            onClick={() => setParams(prev => ({ ...prev, page: prev.page! + 1 }))}
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>

            {/* Diff Modal */}
            {selectedLog && (
                <div className="modal modal-open">
                    <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FaHistory className="text-primary" />
                                Change Details
                            </h3>
                            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setSelectedLog(null)}>✕</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-base-200 p-4 rounded-lg overflow-x-auto">
                                <h4 className="font-bold text-sm mb-2 text-error">Before</h4>
                                <pre className="text-xs font-mono">{JSON.stringify(selectedLog.diffBefore, null, 2) || "null"}</pre>
                            </div>
                            <div className="bg-base-200 p-4 rounded-lg overflow-x-auto">
                                <h4 className="font-bold text-sm mb-2 text-success">After</h4>
                                <pre className="text-xs font-mono">{JSON.stringify(selectedLog.diffAfter, null, 2) || "null"}</pre>
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-base-content/50">
                            Request ID: {selectedLog.requestId} | IP: {selectedLog.ipAddress} | User Agent: {selectedLog.userAgent}
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setSelectedLog(null)}></div>
                </div>
            )}
        </div>
    );
}
