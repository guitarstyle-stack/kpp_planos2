"use client";

import { useState, useTransition, useMemo } from "react";
import {
    sendAdvancedNotificationAction,
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
    faImage,
    faLink,
    faCheckDouble,
    faUserShield
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

interface Role {
    id: number;
    name: string;
    label: string | null;
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
    roles: Role[];
    history: any[];
    templates: Template[];
}

export function NotificationManager({ users, departments, roles, history, templates }: NotificationManagerProps) {
    const [activeTab, setActiveTab] = useState<"send" | "history">("send");
    const [targetType, setTargetType] = useState<"all" | "department" | "user" | "role" | "multi_user" | "multi_dept">("all");
    const [targetId, setTargetId] = useState<number | "">("");
    const [targetIds, setTargetIds] = useState<number[]>([]);
    const [isPending, startTransition] = useTransition();

    // Form State
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [link, setLink] = useState("");
    const [imageUrl, setImageUrl] = useState("");
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

    const toggleTargetId = (id: number) => {
        setTargetIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

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
        formData.append("imageUrl", imageUrl);
        formData.append("type", type);
        formData.append("targetType", targetType);

        if (targetId) formData.append("targetId", targetId.toString());
        if (targetIds.length > 0) formData.append("targetIds", targetIds.join(","));

        if (isScheduled && scheduledFor) {
            formData.append("scheduledFor", scheduledFor);
        }

        startTransition(async () => {
            try {
                const result = await sendAdvancedNotificationAction(formData);

                if (result?.success) {
                    toast.success(result.scheduled ? "ตั้งเวลาส่งสำเร็จ" : `ส่งข้อความสำเร็จ (${result.count} คน)`);
                    if (!result.scheduled) {
                        setTitle("");
                        setMessage("");
                        setLink("");
                        setImageUrl("");
                        setTargetId("");
                        setTargetIds([]);
                    }
                }
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "เกิดข้อผิดพลาดในการส่งข้อความ");
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
                                <h2 className="card-title">สร้างการแจ้งเตือนแบบยืดหยุ่น</h2>
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
                                    <label className="label cursor-pointer justify-start gap-4 flex-wrap">
                                        <span className="label-text font-bold w-full mb-2">ส่งถึงกลุ่มเป้าหมาย:</span>
                                        <label className="cursor-pointer flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded-full border border-base-300">
                                            <input type="radio" name="target" className="radio radio-xs radio-primary" checked={targetType === "all"} onChange={() => { setTargetType("all"); setTargetIds([]); }} />
                                            <span className="text-xs font-medium"><FontAwesomeIcon icon={faBullhorn} className="mr-1" /> ทุกคน</span>
                                        </label>
                                        <label className="cursor-pointer flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded-full border border-base-300">
                                            <input type="radio" name="target" className="radio radio-xs radio-primary" checked={targetType === "department"} onChange={() => { setTargetType("department"); setTargetIds([]); }} />
                                            <span className="text-xs font-medium"><FontAwesomeIcon icon={faBuilding} className="mr-1" /> รายแผนก</span>
                                        </label>
                                        <label className="cursor-pointer flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded-full border border-base-300">
                                            <input type="radio" name="target" className="radio radio-xs radio-primary" checked={targetType === "user"} onChange={() => { setTargetType("user"); setTargetIds([]); }} />
                                            <span className="text-xs font-medium"><FontAwesomeIcon icon={faUser} className="mr-1" /> รายบุคคล</span>
                                        </label>
                                        <label className="cursor-pointer flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded-full border border-base-300">
                                            <input type="radio" name="target" className="radio radio-xs radio-primary" checked={targetType === "role"} onChange={() => { setTargetType("role"); setTargetIds([]); }} />
                                            <span className="text-xs font-medium"><FontAwesomeIcon icon={faUserShield} className="mr-1" /> ตามบทบาท</span>
                                        </label>
                                        <label className="cursor-pointer flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded-full border border-base-300">
                                            <input type="radio" name="target" className="radio radio-xs radio-primary" checked={targetType === "multi_dept"} onChange={() => { setTargetType("multi_dept"); setTargetIds([]); }} />
                                            <span className="text-xs font-medium"><FontAwesomeIcon icon={faCheckDouble} className="mr-1" /> หลายแผนก</span>
                                        </label>
                                        <label className="cursor-pointer flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded-full border border-base-300">
                                            <input type="radio" name="target" className="radio radio-xs radio-primary" checked={targetType === "multi_user"} onChange={() => { setTargetType("multi_user"); setTargetIds([]); }} />
                                            <span className="text-xs font-medium"><FontAwesomeIcon icon={faCheckDouble} className="mr-1" /> หลายคน</span>
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

                                    {targetType === "role" && (
                                        <div className="grid grid-cols-2 gap-2 mt-2 bg-white p-3 rounded-lg border border-base-300 max-h-40 overflow-y-auto">
                                            {roles.map(r => (
                                                <label key={r.id} className="cursor-pointer flex items-center gap-2 hover:bg-base-100 p-1 rounded transition-colors text-sm">
                                                    <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={targetIds.includes(r.id)} onChange={() => toggleTargetId(r.id)} />
                                                    <span>{r.label || r.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {targetType === "multi_dept" && (
                                        <div className="grid grid-cols-2 gap-2 mt-2 bg-white p-3 rounded-lg border border-base-300 max-h-40 overflow-y-auto">
                                            {departments.map(d => (
                                                <label key={d.id} className="cursor-pointer flex items-center gap-2 hover:bg-base-100 p-1 rounded transition-colors text-sm">
                                                    <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={targetIds.includes(d.id)} onChange={() => toggleTargetId(d.id)} />
                                                    <span>{d.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {targetType === "multi_user" && (
                                        <div className="flex flex-col gap-1 mt-2 bg-white p-3 rounded-lg border border-base-300 max-h-40 overflow-y-auto">
                                            {users.map(u => (
                                                <label key={u.id} className="cursor-pointer flex items-center gap-2 hover:bg-base-100 p-1 rounded transition-colors text-sm">
                                                    <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={targetIds.includes(u.id)} onChange={() => toggleTargetId(u.id)} />
                                                    <div className="flex flex-col">
                                                        <span>{u.name}</span>
                                                        <span className="text-[10px] opacity-50">{u.department?.name}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">หัวข้อ (Title)</span></label>
                                    <input type="text" className="input input-bordered" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="เช่น แจ้งปิดปรับปรุงระบบ" />
                                </div>

                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">ข้อความ (Message)</span></label>
                                    <textarea className="textarea textarea-bordered h-24" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="รายละเอียดที่ต้องการแจ้ง..." />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control text-sm">
                                        <label className="label"><span className="label-text flex items-center gap-2"><FontAwesomeIcon icon={faLink} className="text-primary" /> ลิงก์รายละเอียด (Optional)</span></label>
                                        <input type="text" className="input input-bordered input-sm" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/dashboard" />
                                    </div>
                                    <div className="form-control text-sm">
                                        <label className="label"><span className="label-text flex items-center gap-2"><FontAwesomeIcon icon={faImage} className="text-primary" /> ลิงก์รูปภาพประกอบ (Optional)</span></label>
                                        <input type="text" className="input input-bordered input-sm" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                                    </div>
                                </div>

                                <div className="form-control max-w-xs">
                                    <label className="label"><span className="label-text">ประเภทการแจ้งเตือน</span></label>
                                    <select className="select select-bordered select-sm" value={type} onChange={(e) => setType(e.target.value as any)}>
                                        <option value="INFO">Information (Blue)</option>
                                        <option value="WARNING">Warning (Yellow)</option>
                                        <option value="SUCCESS">Success (Green)</option>
                                        <option value="ERROR">Error (Red)</option>
                                    </select>
                                </div>

                                {/* Scheduling */}
                                <div className="form-control bg-base-200/30 p-4 rounded-lg border border-dashed border-base-300">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} />
                                        <span className="label-text font-bold flex items-center gap-2"><FontAwesomeIcon icon={faClock} /> ตั้งเวลาส่งล่วงหน้า</span>
                                    </label>
                                    {isScheduled && (
                                        <div className="mt-2 pl-12">
                                            <input
                                                type="datetime-local"
                                                className="input input-bordered input-sm w-full max-w-xs"
                                                value={scheduledFor}
                                                onChange={(e) => setScheduledFor(e.target.value)}
                                                required={isScheduled}
                                            />
                                            <p className="text-[10px] mt-1 opacity-60">* ระบบจะส่งข้อความหาผู้ใช้ตามเวลาที่กำหนดโดยอัตโนมัติ</p>
                                        </div>
                                    )}
                                </div>

                                <div className="card-actions justify-between mt-6 items-center">
                                    <div>
                                        {!showTemplateSave ? (
                                            <button type="button" className="btn btn-ghost btn-xs text-[10px] opacity-70 hover:opacity-100" onClick={() => setShowTemplateSave(true)}>
                                                <FontAwesomeIcon icon={faSave} /> บันทึกชุดนี้เป็น Template
                                            </button>
                                        ) : (
                                            <div className="join scale-90 origin-left">
                                                <input className="input input-xs input-bordered join-item w-32" placeholder="ชื่อ Template..." value={templateName} onChange={e => setTemplateName(e.target.value)} />
                                                <button type="button" className="btn btn-xs btn-primary join-item" onClick={handleSaveTemplate}>Save</button>
                                                <button type="button" className="btn btn-xs btn-ghost join-item" onClick={() => setShowTemplateSave(false)}>Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                    <button type="submit" className="btn btn-primary px-8" disabled={isPending}>
                                        {isPending ? <span className="loading loading-spinner"></span> : <FontAwesomeIcon icon={isScheduled ? faClock : faPaperPlane} />}
                                        {isScheduled ? "บันทึกกำหนดการ" : "ส่งเข้า LINE ทันที"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title mb-4">ประวัติการแจ้งเตือน</h2>
                            <div className="overflow-x-auto">
                                <table className="table table-sm">
                                    <thead>
                                        <tr className="bg-base-200/50">
                                            <th>Date</th>
                                            <th>Recipient</th>
                                            <th>Title</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((n) => (
                                            <tr key={n.id} className="hover">
                                                <td className="text-[10px] opacity-70 whitespace-nowrap">
                                                    {new Date(n.createdAt).toLocaleDateString()}<br />
                                                    {new Date(n.createdAt).toLocaleTimeString()}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="avatar placeholder">
                                                            <div className="bg-neutral text-neutral-content rounded-full w-6 h-6">
                                                                <span className="text-[10px]">{n.user?.name?.charAt(0)}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold">{n.user?.name}</div>
                                                            <div className="text-[10px] opacity-50">{n.user?.department?.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-xs font-medium">{n.title}</td>
                                                <td>
                                                    <span className={`badge badge-xs ${n.type === 'SUCCESS' ? 'badge-success' :
                                                        n.type === 'ERROR' ? 'badge-error' :
                                                            n.type === 'WARNING' ? 'badge-warning' : 'badge-info'
                                                        } text-white font-bold`}>{n.type}</span>
                                                </td>
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
                <div className="sticky top-8">
                    <div className="mockup-phone border-primary shadow-2xl scale-90 -mt-10 lg:mt-0">
                        <div className="camera"></div>
                        <div className="display">
                            <div className="artboard artboard-demo phone-1 bg-sky-200 justify-start pt-12 px-4 gap-4 overflow-y-auto">
                                <div className="text-[#3b5998] text-[10px] font-bold opacity-80 mb-4 self-center uppercase tracking-widest">LINE Official Account</div>

                                {/* Flex Bubble Mockup */}
                                <div className="w-full">
                                    <div className="flex items-center gap-1.5 mb-1 ml-2">
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[8px] text-white font-bold">P</div>
                                        <div className="text-[10px] text-gray-700 font-bold">PlanOS Bot</div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-[260px] border border-gray-100">
                                        {/* Header */}
                                        <div className={`${getHeaderColor(type)} p-1.5 flex justify-center`}>
                                            <span className="text-white text-[8px] font-bold uppercase tracking-wider">{type}</span>
                                        </div>

                                        {/* Hero Image */}
                                        {imageUrl ? (
                                            <div className="w-full h-32 bg-gray-200 overflow-hidden relative">
                                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-3 border-b border-gray-50 bg-gray-50/50"></div>
                                        )}

                                        {/* Body */}
                                        <div className="p-4">
                                            <div className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-snug">{title || "หัวข้อการแจ้งเตือนจะแสดงตรงนี้"}</div>
                                            <div className="text-gray-500 text-xs line-clamp-5 leading-relaxed">{message || "รายละเอียดเนื้อหาที่ Admin เขียนจะแสดงในส่วนนี้เพื่อให้ผู้ใช้ทราบรายละเอียดเบื้องต้น..."}</div>
                                        </div>
                                        {/* Footer */}
                                        {link ? (
                                            <div className="p-3 pt-0">
                                                <div className={`w-full py-1.5 rounded-lg text-center text-[11px] font-bold text-white transition-opacity cursor-default ${type === 'WARNING' ? 'bg-yellow-500' : type === 'ERROR' ? 'bg-red-500' : type === 'SUCCESS' ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}>
                                                    ดูรายละเอียด
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-2"></div>
                                        )}
                                    </div>
                                    <div className="text-[9px] text-gray-500 mt-1.5 ml-1 opacity-60">Today 09:41 PM</div>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-4 text-sm font-medium opacity-50 flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faBullhorn} className="text-primary" />
                        ตัวอย่าง Flex Message บนมือถือ
                    </div>
                </div>
            </div>
        </div>
    );
}
