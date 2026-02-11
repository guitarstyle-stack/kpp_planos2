
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faWrench, faRocket, faBug, faBolt } from "@fortawesome/free-solid-svg-icons";

interface UpdateItem {
    version: string;
    date: string;
    title: string;
    description: string;
    changes: Array<{
        type: "FEATURE" | "FIX" | "IMPROVEMENT" | "REMOVED";
        text: string;
    }>;
}

const updates: UpdateItem[] = [
    {
        version: "1.4.0",
        date: "11 ก.พ. 2026",
        title: "Multimedia Optimization & Admin Controls",
        description: "ยกระดับประสบการณ์การใช้งานด้วยระบบบจัดการสื่ออัจฉริยะและการควบคุมระดับสูงสำหรับผู้ดูแลระบบ",
        changes: [
            { type: "FEATURE", text: "ระบบย่อขนาดภาพอัตโนมัติ (Image Compression) เมื่อไฟล์ภาพมีขนาด > 1MB เพื่อความรวดเร็วในการอัปโหลด" },
            { type: "IMPROVEMENT", text: "ปรับปรุง Logic การซิงค์ข้อมูลรายงานโครงการ (Sync Logic) ให้ยึดตามปีงบประมาณและรอบรายงานล่าสุด" },
            { type: "FEATURE", text: "เพิ่มปุ่มลบโครงการโดยตรงในหน้า Admin Projects พร้อมระบบยืนยัน (Confirmation)" },
            { type: "FIX", text: "แก้ไขลำดับการลบข้อมูล (Delete Order) ในฐานข้อมูลเพื่อรองรับการลบโครงการแบบไม่มีติดขัด" },
            { type: "IMPROVEMENT", text: "เปลี่ยนระบบการแจ้งเตือนหลักเป็น Sonner เพื่อความสวยงามและลื่นไหลของ UI" }
        ]
    },
    {
        version: "1.3.0",
        date: "11 ก.พ. 2026",
        title: "System Stability & Database Optimization",
        description: "ปรับปรุงความเสถียรของระบบ แก้ไขปัญหาคอขวดของฐานข้อมูล และเพิ่มประสิทธิภาพการส่งข้อความ LINE",
        changes: [
            { type: "IMPROVEMENT", text: "เพิ่ม Connection Pool และ Request Memoization ด้วย React cache() เพื่อลดภาระฐานข้อมูล" },
            { type: "FIX", text: "แก้ไข Infinite Loop ในหน้าค้นหาโครงการที่ทำให้เกิด Request ซ้ำซ้อน" },
            { type: "IMPROVEMENT", text: "รองรับการส่ง LINE Multicast (ส่งหลายคนพร้อมกัน) แทนการส่งทีละคน" },
            { type: "IMPROVEMENT", text: "ปรับปรุง AI Service ให้รองรับ Native JSON Mode เพื่อความเสถียรสูงขึ้น" },
            { type: "IMPROVEMENT", text: "ตรวจสอบและยืนยันความเสถียรของระบบทั้งหมด (System-wide Audit)" }
        ]
    },
    {
        version: "1.2.1",
        date: "11 ก.พ. 2026",
        title: "Performance Optimization & Dashboard Rollback",
        description: "ปรับปรุงประสิทธิภาพของระบบ Dashboard และแก้ไขปัญหาความล่าช้า",
        changes: [
            { type: "REMOVED", text: "นำ AI Executive Briefing ออกชั่วคราว เพื่อแก้ปัญหา System Lag" },
            { type: "IMPROVEMENT", text: "ปรับปรุงการโหลดข้อมูลหน้า Dashboard ให้เร็วขึ้น" },
            { type: "FEATURE", text: "เพิ่มหน้า Reports & Changelog (หน้านี้)" }
        ]
    },
    {
        version: "1.2.0",
        date: "11 ก.พ. 2026",
        title: "Expert AI & Dashboard Enhancements",
        description: "เพิ่มความสามารถด้าน AI และปรับปรุงหน้าจอ Dashboard ให้ทันสมัย",
        changes: [
            { type: "FEATURE", text: "เพิ่ม Intelligent Dashboard Concept (AI Executive Briefing - Beta)" },
            { type: "FEATURE", text: "วางแผน Roadmap สำหรับ Expert AI (Strategic Agent, Budget Forecaster)" },
            { type: "IMPROVEMENT", text: "ปรับปรุง UI/UX หน้า Dashboard ด้วย Glassmorphism Design" }
        ]
    },
    {
        version: "1.1.0",
        date: "10 ก.พ. 2026",
        title: "Messaging System Fixes",
        description: "แก้ไขปัญหาการใช้งานระบบส่งข้อความและการแสดงผล",
        changes: [
            { type: "FIX", text: "แก้ปัญหา Date Serialization Error ที่ทำให้หน้า Conversations ขาว" },
            { type: "IMPROVEMENT", text: "รองรับการแสดงผลวันที่แบบ Real-time และย้อนหลังได้ถูกต้อง" },
            { type: "FIX", text: "ตรวจสอบความเข้ากันได้กับ Next.js 15 (Params Handling)" }
        ]
    },
    {
        version: "1.0.0",
        date: "01 ม.ค. 2026",
        title: "Initial Launch",
        description: "เปิดตัวระบบ PlanOS อย่างเป็นทางการ",
        changes: [
            { type: "FEATURE", text: "ระบบบริหารจัดการโครงการ (Projects Management)" },
            { type: "FEATURE", text: "ระบบรายงานผล (Reporting System)" },
            { type: "FEATURE", text: "ระบบส่งข้อความ (Messaging)" },
            { type: "FEATURE", text: "Dashboard ภาพรวมผู้บริหาร" }
        ]
    }
];

export default function UpdatesPage() {
    const getTypeColor = (type: string) => {
        switch (type) {
            case "FEATURE": return "badge-success badge-outline";
            case "FIX": return "badge-error badge-outline";
            case "IMPROVEMENT": return "badge-info badge-outline";
            case "REMOVED": return "badge-ghost badge-outline dashed";
            default: return "badge-ghost";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "FEATURE": return faRocket;
            case "FIX": return faBug;
            case "IMPROVEMENT": return faBolt;
            case "REMOVED": return faWrench;
            default: return faCheckCircle;
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2 mb-10">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">
                    System Updates & Changelog
                </h1>
                <p className="text-sm opacity-60">
                    รายงานการอัพเดทฟีเจอร์และการแก้ไขปรับปรุงระบบ
                </p>
            </div>

            <div className="relative border-l-2 border-base-300 ml-4 md:ml-6 space-y-12">
                {updates.map((update, index) => (
                    <div key={index} className="relative pl-8 md:pl-12 group">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-base-100 border-2 border-primary group-hover:bg-primary group-hover:scale-125 transition-all duration-300 shadow-[0_0_0_4px_rgba(var(--p),0.1)]"></div>

                        <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 border border-base-200">
                            <div className="card-body p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-base-100 pb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-mono text-lg font-bold text-primary">v{update.version}</span>
                                            {index === 0 && <span className="badge badge-primary badge-sm animate-pulse">LATEST</span>}
                                        </div>
                                        <h3 className="text-xl font-bold">{update.title}</h3>
                                    </div>
                                    <div className="text-sm opacity-50 font-mono bg-base-200 px-3 py-1 rounded-full w-fit">
                                        {update.date}
                                    </div>
                                </div>

                                <p className="opacity-80 mb-6">{update.description}</p>

                                <div className="space-y-3">
                                    {update.changes.map((change, cIndex) => (
                                        <div key={cIndex} className="flex items-start gap-3 text-sm">
                                            <span className={`badge ${getTypeColor(change.type)} w-24 shrink-0 gap-1`}>
                                                {/* <FontAwesomeIcon icon={getTypeIcon(change.type)} className="w-3 h-3" /> */}
                                                {change.type}
                                            </span>
                                            <span className="opacity-70 leading-relaxed pt-0.5">{change.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
