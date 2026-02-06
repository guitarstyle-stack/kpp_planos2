# PlanOS - ระบบติดตามและรายงานโครงการ (Project Planning & Monitoring System)

PlanOS คือแพลตฟอร์มสำหรับบริหารจัดการและติดตามความคืบหน้าโครงการตามแผนปฏิบัติการ ออกแบบมาเพื่อช่วยให้หน่วยงานสามารถติดตามงบประมาณและตัวชี้วัด (KPI) ได้อย่างมีประสิทธิภาพ พร้อมระบบบันทึกประวัติการเปลี่ยนแปลงที่โปร่งใส

## 🌟 คุณสมบัติเด่น (Core Features)

*   **🔐 ระบบความปลอดภัยและสิทธิ์การใช้งาน (Security & RBAC):**
    *   **LINE Login:** เข้าใช้งานได้ง่ายผ่านบัญชี LINE
    *   **Role-Based Access Control:** แบ่งสิทธิ์ตามบทบาท (SYSADMIN, ADMIN, DEPT_MANAGER, EDITOR, VIEWER)
    *   **Department Isolation:** แยกข้อมูลตามหน่วยงานต้นสังกัด
*   **📊 การจัดการโครงการ (Project Management):**
    *   จัดการโครงการแยกตามปีงบประมาณและแผนยุทธศาสตร์
    *   กำหนดตัวชี้วัด (KPI) ประจำโครงการพร้อมค่าเป้าหมาย
*   **📝 ระบบรายงานความคืบหน้า (Enhanced Reporting):**
    *   คำนวณงบประมาณเบิกจ่ายสะสมและร้อยละความสำเร็จอัตโนมัติ
    *   ระบบคำนวณ Cumulative Results จากทุกรายงานในโครงการ
    *   รองรับการแนบหลักฐานเอกสารและรูปภาพผ่าน Supabase Storage
*   **💬 ระบบสื่อสารภายใน (Messaging System):**
    *   Interactive Chat สำหรับปรึกษาหารือรายโครงการหรือรายรายงาน
    *   ระบบสถานะการอ่านข้อความ (Read Receipts)
*   **🛡️ ระบบตรวจสอบความโปร่งใส (Audit Logs):**
    *   บันทึกทุกการแก้ไขข้อมูลพร้อมแสดง Diff ก่อนและหลังเปลี่ยน
    *   ประวัติการเข้าสู่ระบบ (Login Auditing)
*   **🔔 ระบบแจ้งเตือน (Notifications):**
    *   แจ้งเตือนกิจกรรมสำคัญในระบบ
    *   Smart Alert สำหรับผู้ใช้ที่ยังไม่ได้ระบุหน่วยงานสังกัด

## 🚀 เทคโนโลยีที่ใช้ (Tech Stack)

*   **Frontend/Backend:** Next.js (App Router), React 19, TypeScript
*   **Database:** PostgreSQL (Supabase)
*   **ORM:** Prisma
*   **Authentication:** Custom JWT with LINE Login API
*   **Storage:** Supabase Storage
*   **Styling:** Tailwind CSS 4, DaisyUI
*   **Icons:** FontAwesome 7
*   **Monitoring:** Vercel Analytics & Speed Insights

## 📚 เอกสารวิเคราะห์ระบบ (System Analysis)
คุณสามารถอ่านบทวิเคราะห์ระบบฉบับสมบูรณ์ได้ที่: [system_analysis.md](./system_analysis.md)

## 🛠 การติดตั้ง (Installation)

1. **Clone Repository:**
   ```bash
   git clone https://github.com/guitarstyle-stack/kpp_planos2.git
   cd kpp_planos2/planos
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   สร้างไฟล์ `.env.local` ตามตัวอย่างใน `.env.example`:
   * `DATABASE_URL`: Postgres Connection String
   * `LINE_CHANNEL_ID` & `LINE_CHANNEL_SECRET`: จาก LINE Developers
   * `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: สำหรับระบบจัดเก็บไฟล์

4. **Initialize Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Application:**
   ```bash
   npm run dev
   ```

## 📦 การ Deploy
ระบบรองรับการ Deploy บน **Vercel** โดยอัตโนมัติเมื่อมีการ Push โค้ดไปยังสาขาหลัก (main)

---
Developed with ❤️ by **PlanOS Team**
