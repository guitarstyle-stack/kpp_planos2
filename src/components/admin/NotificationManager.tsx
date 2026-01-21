"use client";

import { useState, useTransition } from "react";
import { broadcastNotificationAction, sendDepartmentNotificationAction, sendUserNotificationAction } from "@/actions/notificationActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faBullhorn, faUser, faBuilding, faHistory, faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface User {
    id: number;
    name: string;
    department: {
        name: string;
    } | null;
}

interface Department {
    id: number;
    name: string;
}

interface NotificationManagerProps {
    users: User[];
    departments: Department[];
    history: any[];
}

export function NotificationManager({ users, departments, history }: NotificationManagerProps) {
    const [activeTab, setActiveTab] = useState<"send" | "history">("send");
    const [targetType, setTargetType] = useState<"broadcast" | "department" | "user">("broadcast");
    const [targetId, setTargetId] = useState<number | "">("");
    const [isPending, startTransition] = useTransition();

    // Form State
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [link, setLink] = useState("");
    const [type, setType] = useState<"INFO" | "WARNING" | "SUCCESS" | "ERROR">("INFO");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!confirm("ยืนยันการส่งการแจ้งเตือน? ข้อความจะถูกส่งไปยัง LINE ของผู้ใช้ทันที")) {
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("message", message);
        formData.append("link", link);
        formData.append("type", type);

        startTransition(async () => {
            try {
                let result;
                if (targetType === "broadcast") {
                    result = await broadcastNotificationAction(formData);
                } else if (targetType === "department" && targetId) {
                    result = await sendDepartmentNotificationAction(Number(targetId), formData);
                } else if (targetType === "user" && targetId) {
                    result = await sendUserNotificationAction(Number(targetId), formData);
                } else {
                    toast.error("กรุณาเลือกเป้าหมาย");
                    return;
                }

                if (result?.success) {
                    toast.success(`ส่งข้อความสำเร็จ (${result.count} คน)`);
                    setTitle("");
                    setMessage("");
                    setLink("");
                    setTargetId("");
                }
            } catch (error) {
                console.error(error);
                toast.error("เกิดข้อผิดพลาดในการส่งข้อความ");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Actions */}
            <div className="lg:col-span-2 space-y-6">
                <div role="tablist" className="tabs tabs-boxed">
                    <a role="tab" className={`tab ${activeTab === "send" ? "tab-active" : ""}`} onClick={() => setActiveTab("send")}>
                        <FontAwesomeIcon icon={faPaperPlane} className="mr-2" /> ส่งข้อความ
                    </a>
                    <a role="tab" className={`tab ${activeTab === "history" ? "tab-active" : ""}`} onClick={() => setActiveTab("history")}>
                        <FontAwesomeIcon icon={faHistory} className="mr-2" /> ประวัติการส่ง
                    </a>
                </div>

                {activeTab === "send" && (
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title mb-4">สร้างการแจ้งเตือนใหม่</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Target Selection */}
                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <span className="label-text font-bold w-24">ส่งถึง:</span>
                                        <label className="cursor-pointer flex items-center gap-2">
                                            <input type="radio" name="target" className="radio radio-primary" checked={targetType === "broadcast"} onChange={() => setTargetType("broadcast")} />
                                            <span className="label-text"><FontAwesomeIcon icon={faBullhorn} /> ทุกคน (Broadcast)</span>
                                        </label>
                                        <label className="cursor-pointer flex items-center gap-2">
                                            <input type="radio" name="target" className="radio radio-primary" checked={targetType === "department"} onChange={() => setTargetType("department")} />
                                            <span className="label-text"><FontAwesomeIcon icon={faBuilding} /> แผนก/หน่วยงาน</span>
                                        </label>
                                        <label className="cursor-pointer flex items-center gap-2">
                                            <input type="radio" name="target" className="radio radio-primary" checked={targetType === "user"} onChange={() => setTargetType("user")} />
                                            <span className="label-text"><FontAwesomeIcon icon={faUser} /> รายบุคคล</span>
                                        </label>
                                    </label>
                                </div>

                                {targetType === "department" && (
                                    <select className="select select-bordered w-full" value={targetId} onChange={(e) => setTargetId(Number(e.target.value))} required>
                                        <option value="">เลือกหน่วยงาน...</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                )}

                                {targetType === "user" && (
                                    <select className="select select-bordered w-full" value={targetId} onChange={(e) => setTargetId(Number(e.target.value))} required>
                                        <option value="">เลือกผู้ใช้...</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department?.name})</option>)}
                                    </select>
                                )}

                                {/* Content */}
                                <div className="form-control">
                                    <label className="label"><span className="label-text">หัวข้อ (Title)</span></label>
                                    <input type="text" className="input input-bordered" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="เช่น แจ้งปิดปรับปรุงระบบ" />
                                </div>

                                <div className="form-control">
                                    <label className="label"><span className="label-text">ข้อความ (Message)</span></label>
                                    <textarea className="textarea textarea-bordered h-24" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="รายละเอียดที่ต้องการแจ้ง..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">ลิงก์ (Optional)</span></label>
                                        <input type="text" className="input input-bordered" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/dashboard" />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">ประเภท</span></label>
                                        <select className="select select-bordered" value={type} onChange={(e) => setType(e.target.value as any)}>
                                            <option value="INFO">Information (Blue)</option>
                                            <option value="WARNING">Warning (Yellow)</option>
                                            <option value="SUCCESS">Success (Green)</option>
                                            <option value="ERROR">Error (Red)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="card-actions justify-end mt-6">
                                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                                        {isPending ? <span className="loading loading-spinner"></span> : <FontAwesomeIcon icon={faPaperPlane} />}
                                        ส่งข้อความ
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title mb-4">ประวัติการส่งล่าสุด</h2>
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Title</th>
                                            <th>Message</th>
                                            <th>User</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((n) => (
                                            <tr key={n.id}>
                                                <td className="text-xs opacity-70">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}</td>
                                                <td className="font-bold">{n.title}</td>
                                                <td className="text-sm truncate max-w-xs">{n.message}</td>
                                                <td className="text-xs">{n.user?.name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Col: Preview */}
            <div className="lg:col-span-1">
                <div className="mockup-phone border-primary">
                    <div className="camera"></div>
                    <div className="display">
                        <div className="artboard artboard-demo phone-1 bg-[#849bcf] justify-start pt-12 px-4 gap-4">
                            <div className="text-white text-sm font-bold opacity-80 mb-4 self-center">LINE Application</div>

                            {/* Line Bubble Mockup */}
                            <div className="chat chat-start w-full">
                                <div className="chat-image avatar">
                                    <div className="w-10 rounded-full">
                                        <div className="bg-white w-full h-full flex items-center justify-center font-bold text-primary">KPP</div>
                                    </div>
                                </div>
                                <div className="chat-header text-xs text-white opacity-70 mb-1">
                                    PlanOS Bot
                                </div>
                                <div className="chat-bubble bg-white text-black text-sm p-4 shadow-sm flex flex-col gap-2">
                                    <div className="font-bold text-primary">{title || "หัวข้อการแจ้งเตือน"}</div>
                                    <div className="whitespace-pre-wrap">{message || "รายละเอียดเนื้อหาจะแสดงตรงนี้..."}</div>
                                    {link && <div className="text-blue-500 underline text-xs mt-2">ดูรายละเอียดเพิ่มเติม</div>}
                                </div>
                                <div className="chat-footer opacity-50 text-xs text-white mt-1">
                                    Read 09:41 PM
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <div className="text-center mt-4 text-sm opacity-50">
                    ตัวอย่างการแสดงผลบน LINE (อาจแตกต่างกันไปตามอุปกรณ์)
                </div>
            </div>
        </div>
    );
}
