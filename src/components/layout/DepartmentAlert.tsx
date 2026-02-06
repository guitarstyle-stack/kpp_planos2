import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faArrowRight } from "@fortawesome/free-solid-svg-icons";

interface DepartmentAlertProps {
    userName: string;
}

export function DepartmentAlert({ userName }: DepartmentAlertProps) {
    return (
        <div className="bg-warning text-warning-content px-4 py-3 shadow-md border-b border-warning-focus/20 relative animate-pulse-subtle">
            <div className="mx-auto max-w-screen-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full hidden sm:flex">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="font-bold">สวัสดีครับคุณ {userName}</span>
                        <p className="text-sm opacity-90">
                            ดูเหมือนคุณยังไม่ได้เลือก **"หน่วยงาน"** ที่สังกัดจริง กรุณาอัปเดตข้อมูลเพื่อเริ่มใช้งานระบบอย่างเต็มรูปแบบ
                        </p>
                    </div>
                </div>
                <Link
                    href="/settings/profile"
                    className="btn btn-sm btn-ghost bg-black/10 hover:bg-black/20 border-none gap-2"
                >
                    ไปที่ตั้งค่าโปรไฟล์
                    <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}

// Add index.css animation for subtle pulse if needed, or use tailwind classes if available.
// Assuming we can use standard daisyUI/tailwind.
