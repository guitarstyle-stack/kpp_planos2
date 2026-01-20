# PlanOS - ระบบติดตามและรายงานโครงการ (Project Tracking System)

PlanOS คือแพลตฟอร์มสำหรับบริหารจัดการและติดตามความคืบหน้าโครงการตามแผนปฏิบัติการ ออกแบบมาเพื่อช่วยให้หน่วยงานสามารถติดตามงบประมาณและตัวชี้วัด (KPI) ได้อย่างมีประสิทธิภาพ

## 🌟 คุณสมบัติเด่น (Core Features)

*   **ระบบล็อกอินผ่าน LINE (LINE Login):** เข้าใช้งานได้ง่ายและปลอดภัยผ่านบัญชี LINE
*   **การจัดการโครงการ (Project Management):** มอบหมายโครงการ แยกตามปีงบประมาณและหน่วยงาน
*   **ระบบรายงานความคืบหน้า (Enhanced Reporting):**
    *   คำนวณงบประมาณเบิกจ่ายสะสมและร้อยละความคืบหน้าให้อัตโนมัติ
    *   ติดตามตัวชี้วัด (KPI) รายตัว พร้อมรายงานผลการบรรลุเป้าหมาย
    *   รองรับการแนบไฟล์เอกสารและรูปภาพประกอบรายงาย
*   **แดชบอร์ดผู้ดูแลระบบ (Admin Dashboard):**
    *   สรุปภาพรวมโครงการและงบประมาณสะสม
    *   จัดการข้อมูลมาสเตอร์ดาต้า (ปีงบประมาณ, แผนยุทธศาสตร์, หน่วยงาน)
    *   จัดการสิทธิ์ผู้ใช้งาน (RBAC) และข้อมูลสังกัด
*   **ระบบวิเคราะห์ข้อมูล (Analytics):** รองรับ Vercel Web Analytics และ Speed Insights

## 🚀 เทคโนโลยีที่ใช้ (Tech Stack)

*   **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
*   **Language:** Typescript
*   **Database:** PostgreSQL (via [Supabase](https://supabase.com/))
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Authentication:** Custom JWT with LINE Login API
*   **UI Library:** [DaisyUI](https://daisyui.com/) & [Tailwind CSS 4](https://tailwindcss.com/)
*   **Icons:** [FontAwesome](https://fontawesome.com/)
*   **Deployment:** [Vercel](https://vercel.com/)

## 🛠 การติดตั้ง (Installation)

### 1. ลอกเลียนโครงการ (Clone Repository)
```bash
git clone https://github.com/guitarstyle-stack/kpp_planos2.git
cd kpp_planos2
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่าสภาพแวดล้อม (Environment Variables)
สร้างไฟล์ `.env.local` และคัดลอกข้อมูลจาก `.env.example` มาวาง พร้อมระบุค่าต่างๆ ให้ครบถ้วน:
*   `DATABASE_URL`: URL สำหรับเชื่อมต่อฐานข้อมูล Postgres
*   `LINE_CHANNEL_ID` & `LINE_CHANNEL_SECRET`: ได้จาก LINE Developers Console
*   `NEXTAUTH_SECRET`: รหัสลับสำหรับ Token

### 4. เตรียมฐานข้อมูล (Database Setup)
```bash
npx prisma generate
npx prisma db push
```

### 5. เริ่มต้นใช้งาน (Start Development Server)
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ `http://localhost:3000`

## 📦 การ Deploy บน Vercel

1.  Push โค้ดขึ้น GitHub
2.  เชื่อมต่อ Repository บน Vercel Dashboard
3.  ตั้งค่า Environment Variables ใน Vercel ให้ตรงกับ `.env.local`
4.  ระบบจะทำการ Build และ Deploy ให้อัตโนมัติ (พร้อมรัน `prisma generate` ผ่าน `postinstall` script)

## 📄 ใบอนุญาต (License)

โปรเจ็คนี้พัฒนาเพื่อใช้งานภายในองค์กร

---
พัฒนาโดยทีมงาน **PlanOS Team**
