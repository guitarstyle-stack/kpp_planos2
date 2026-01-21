"use client";

import { useState, useTransition } from "react";
import {
    broadcastNotificationAction,
    sendDepartmentNotificationAction,
    sendUserNotificationAction,
    createTemplateAction
} from "@/actions/notificationActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPaperPlane,
    faBullhorn,
    faUser,
    faBuilding,
    faHistory,
    faSave,
    faClock,
    faFileAlt
} from "@fortawesome/free-solid-svg-icons";
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

interface Template {
    id: number;
    name: string;
    title: string;
    message: string;
    link?: string | null;
    type: string;
}

interface NotificationManagerProps {
    users: User[];
    departments: Department[];
    history: any[];
    templates: Template[];
}

export function NotificationManager({ users, departments, history, templates }: NotificationManagerProps) {
    const [activeTab, setActiveTab] = useState<"send" | "history">("send");
    const [targetType, setTargetType] = useState<"broadcast" | "department" | "user">("broadcast");
    const [targetId, setTargetId] = useState<number | "">("");
    const [isPending, startTransition] = useTransition();

    // Form State
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [link, setLink] = useState("");
    const [type, setType] = useState<"INFO" | "WARNING" | "SUCCESS" | "ERROR">("INFO");

    // Advanced Features
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledFor, setScheduledFor] = useState("");
    const [templateName, setTemplateName] = useState("");
    const [showTemplateSave, setShowTemplateSave] = useState(false);

    const loadTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === Number(templateId));
        if (template) {
            setTitle(template.title);
            setMessage(template.message);
            setLink(template.link || "");
            setType(template.type as any);
            toast.success(`โหลด Template: ${template.name}`);
        }
    };

    const handleSaveTemplate = () => {
        if (!templateName) return toast.error("กรุณาตั้งชื่อ Template");

        const formData = new FormData();
        formData.append("name", templateName);
        formData.append("title", title);
        formData.append("message", message);
        formData.append("link", link);
        formData.append("type", type);

        startTransition(async () => {
            try {
                const result = await createTemplateAction(formData);
                if (result.success) {
                    toast.success("บันทึก Template สำเร็จ");
                    setShowTemplateSave(false);
                    setTemplateName("");
                }
            } catch (error) {
                toast.error("บันทึกไม่สำเร็จ");
            }
        });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const confirmMsg = isScheduled
            ? `ยืนยันการตั้งเวลาส่งในวันที่ ${new Date(scheduledFor).toLocaleString()}?`
            : "ยืนยันการส่งการแจ้งเตือน? ข้อความจะถูกส่งไปยัง LINE ของผู้ใช้ทันที";

        if (!confirm(confirmMsg)) return;

        const formData = new FormData();
        formData.append("title", title);
        formData.append("message", message);
        formData.append("link", link);
        formData.append("type", type);
        if (isScheduled && scheduledFor) {
            formData.append("scheduledFor", scheduledFor);
        }

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
                    toast.success(result.scheduled ? "ตั้งเวลาส่งสำเร็จ" : `ส่งข้อความสำเร็จ (${result.count} คน)`);
                    if (!result.scheduled) {
                        setTitle("");
                        setMessage("");
                        setLink("");
                        setTargetId("");
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("เกิดข้อผิดพลาดในการส่งข้อความ");
            }
        });
    };

    const getHeaderColor = (t: string) => {
        switch (t) {
            case "WARNING": return "bg-yellow-500";
            case "SUCCESS": return "bg-green-500";
            case "ERROR": return "bg-red-500";
            default: return "bg-blue-500";
        }
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
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title">สร้างการแจ้งเตือนใหม่</h2>
                                <div className="flex gap-2">
                                    <select className="select select-sm select-bordered" onChange={(e) => loadTemplate(e.target.value)} defaultValue="">
                                        <option value="" disabled>โหลด Template...</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Target Selection */}
                                <div className="form-control bg-base-200/50 p-4 rounded-lg">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <span className="label-text font-bold w-24">ส่งถึง:</span>
                                        <label className="cursor-pointer flex items-center gap-2">
                                            <input type="radio" name="target" className="radio radio-primary" checked={targetType === "broadcast"} onChange={() => setTargetType("broadcast")} />
                                            <span className="label-text"><FontAwesomeIcon icon={faBullhorn} /> ทุกคน</span>
                                        </label>
                                        <label className="cursor-pointer flex items-center gap-2">
                                            <input type="radio" name="target" className="radio radio-primary" checked={targetType === "department"} onChange={() => setTargetType("department")} />
                                            <span className="label-text"><FontAwesomeIcon icon={faBuilding} /> แผนก</span>
                                        </label>
                                        <label className="cursor-pointer flex items-center gap-2">
                                            <input type="radio" name="target" className="radio radio-primary" checked={targetType === "user"} onChange={() => setTargetType("user")} />
                                            <span className="label-text"><FontAwesomeIcon icon={faUser} /> รายบุคคล</span>
                                        </label>
                                    </label>

                                    {targetType === "department" && (
                                        <select className="select select-bordered w-full mt-2" value={targetId} onChange={(e) => setTargetId(Number(e.target.value))} required>
                                            <option value="">เลือกหน่วยงาน...</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    )}

                                    {targetType === "user" && (
                                        <select className="select select-bordered w-full mt-2" value={targetId} onChange={(e) => setTargetId(Number(e.target.value))} required>
                                            <option value="">เลือกผู้ใช้...</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department?.name})</option>)}
                                        </select>
                                    )}
                                </div>

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

                                {/* Scheduling */}
                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-2">
                                        <input type="checkbox" className="toggle toggle-primary" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} />
                                        <span className="label-text flex items-center gap-2"><FontAwesomeIcon icon={faClock} /> ตั้งเวลาส่งล่วงหน้า</span>
                                    </label>
                                    {isScheduled && (
                                        <input
                                            type="datetime-local"
                                            className="input input-bordered mt-2 w-full max-w-xs"
                                            value={scheduledFor}
                                            onChange={(e) => setScheduledFor(e.target.value)}
                                            required={isScheduled}
                                        />
                                    )}
                                </div>

                                <div className="card-actions justify-between mt-6 items-center">
                                    <div>
                                        {!showTemplateSave ? (
                                            <button type="button" className="btn btn-ghost btn-sm text-xs" onClick={() => setShowTemplateSave(true)}>
                                                <FontAwesomeIcon icon={faSave} /> บันทึกเป็น Template
                                            </button>
                                        ) : (
                                            <div className="join">
                                                <input className="input input-xs input-bordered join-item" placeholder="ชื่อ Template..." value={templateName} onChange={e => setTemplateName(e.target.value)} />
                                                <button type="button" className="btn btn-xs btn-primary join-item" onClick={handleSaveTemplate}>Save</button>
                                                <button type="button" className="btn btn-xs btn-ghost join-item" onClick={() => setShowTemplateSave(false)}>Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                                        {isPending ? <span className="loading loading-spinner"></span> : <FontAwesomeIcon icon={faPaperPlane} />}
                                        {isScheduled ? "บันทึกกำหนดการส่ง" : "ส่งข้อความทันที"}
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
                        <div className="artboard artboard-demo phone-1 bg-[#849bcf] justify-start pt-12 px-4 gap-4 overflow-y-auto">
                            <div className="text-white text-sm font-bold opacity-80 mb-4 self-center">LINE Application</div>

                            {/* Flex Bubble Mockup */}
                            <div className="w-full">
                                <div className="text-[10px] text-white/70 mb-1 ml-2">PlanOS Bot</div>
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden w-full max-w-[260px]">
                                    {/* Header */}
                                    <div className={`${getHeaderColor(type)} p-2 flex justify-center`}>
                                        <span className="text-white text-[10px] font-bold uppercase tracking-wider">{type}</span>
                                    </div>
                                    {/* Body */}
                                    <div className="p-4">
                                        <div className="font-bold text-gray-900 text-sm mb-1">{title || "หัวข้อการแจ้งเตือน"}</div>
                                        <div className="text-gray-500 text-xs">{message || "รายละเอียดเนื้อหาจะแสดงตรงนี้..."}</div>
                                    </div>
                                    {/* Footer */}
                                    {link && (
                                        <div className="p-3 pt-0">
                                            <button className={`btn btn-sm btn-block ${type === 'WARNING' ? 'btn-warning' : type === 'ERROR' ? 'btn-error' : 'btn-info'} text-white no-animation h-8 min-h-0`}>
                                                ดูรายละเอียด
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-[9px] text-white/50 mt-1 ml-1">Read 09:41 PM</div>
                            </div>

                        </div>
                    </div>
                </div>
                <div className="text-center mt-4 text-sm opacity-50">
                    ตัวอย่าง Flex Message บน LINE
                </div>
            </div>
        </div>
    );
}
