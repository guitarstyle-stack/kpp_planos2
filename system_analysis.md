# รายงานบทวิเคราะห์ระบบ PlanOS (Project Planning & Monitoring System)

## 1. บทนำ (Introduction)
PlanOS คือระบบบริหารจัดการแผนงานและติดตามผลการดำเนินงาน (Monitoring & Evaluation) ที่ออกแบบมาเพื่อรองรับการทำงานของรัฐและเอกชน โดยเน้นความง่ายในการใช้งานผ่านการพิสูจน์ตัวตนผ่าน LINE Login และความโปร่งใสในการรวบรวมข้อมูลผ่านระบบ Audit Logging ที่เข้มข้น

## 2. สถาปัตยกรรมทางเทคนิค (Technical Architecture)
- **Framework**: Next.js (App Router) - รองรับงานด้าน Server Side Rendering และ API Routes
- **Language**: TypeScript - เพื่อความแม่นยำและลดข้อผิดพลาดในการเขียนโปรแกรม
- **Database**: PostgreSQL (Managed on Supabase)
- **ORM**: Prisma - สำหรับจัดการ schema และ Query ข้อมูล
- **Authentication**: LINE Login (OAuth 2.0) - สะดวกสำหรับผู้ใช้ไทย
- **Storage**: Supabase Storage - สำหรับเก็บไฟล์แนบประเภทรูปภาพและเอกสาร
- **Styling**: TailwindCSS + DaisyUI - เน้นดีไซน์ที่ทันสมัยและ Responsive
- **Iconography**: FontAwesome

## 3. โมดูลหลักและระบบการทำงาน (Core Modules)

### 3.1 ระบบจัดการผู้ใช้และสิทธิ์การเข้าถึง (User & RBAC)
- **LINE Integration**: ผููกบัญชี LINE เพื่อความปลอดภัยและรวดเร็ว
- **Role-Based Access Control (RBAC)**:
    - **SYSADMIN**: จัดการโครงสร้างพื้นฐานและตรวจสอบ Audit Logs
    - **ADMIN**: จัดการผู้ใช้ในภาพรวมและตั้งค่ามาสเตอร์ดาต้า
    - **DEPT_MANAGER**: จัดการโครงการและรายงานภายในหน่วยงานที่สังกัด
    - **EDITOR/VIEWER**: สิทธิ์ในการแก้ไขหรือดูข้อมูลตามระดับที่ได้รับมอบหมาย
- **Department Mapping**: เชื่อมโยงผู้ใช้เข้ากับหน่วยงาน เพื่อแยกสิทธิ์การมองเห็นข้อมูล (Data Isolation)

### 3.2 ระบบจัดการมาสเตอร์ดาต้า (Master Data)
- **Annual Plan**: จัดการแผนพัฒนาสังคมประจำปีและปีงบประมาณ
- **Development Issue & Goal**: โครงสร้างประเด็นการพัฒนาและเป้าหมายเชิงกลยุทธ์ตามแผนระดับสูง
- **Indicators (Template)**: กำหนดตัวชี้วัดมาตรฐานที่โครงการต่างๆ สามารถนำไปใช้ได้

### 3.3 ระบบบริหารโครงการและตัวชี้วัด (Project & Indicator Management)
- **Project Tracking**: สร้างและติดตามสถานะโครงการ (Not Started, In Progress, Completed)
- **KPI Indicators**: กำหนดตัวชี้วัดเฉพาะโครงการ พร้อมค่าเป้าหมาย (Baseline & Target)
- **Fiscal Year Alignment**: ระบบผูกโครงการตามรอบปีงบประมาณ

### 3.4 ระบบรายงานผล (Reporting System)
- **Periodic Reporting**: การรายงานผลรายไตรมาสหรือรายเดือน (Mid 6M, Mid 9M, Full 12M)
- **Cumulative Calculation**: ระบบคำนวณผลรวมสะสมของตัวชี้วัดและงบประมาณอัตโนมัติจากรายงานทั้งหมดในโครงการ
- **Visual Progress**: แถบความคืบหน้า (Progress Bar) สำหรับงบประมาณและความสำเร็จของตัวชี้วัด
- **Attachment Support**: แนบไฟล์หลักฐานการดำเนินงานได้โดยตรง

### 3.5 ระบบสื่อสารและการแจ้งเตือน (Communication & Notifications)
- **Conversation System**: ห้องสนทนาแยกตามโครงการหรือรายงาน เพื่อการประสานงานที่รวดเร็ว
- **Notification Center**: แจ้งเตือนสถานะต่างๆ ภายในระบบ (Info, Warning, Error)
- **Department Setup Alert**: ระบบเตือนอัตโนมัติหากผู้ใช้ยังไม่ได้เลือกหน่วยงานต้นสังกัด

### 3.6 ระบบตรวจสอบความโปร่งใส (Audit & Security)
- **Detailed Audit Logs**: บันทึกทุกกิจกรรมการเพิ่ม/แก้ไข/ลบข้อมูล พร้อมเปรียบเทียบค่าก่อนและหลังเปลี่ยน (Diff Comparison)
- **Login Auditing**: บันทึกประวัติการเข้าใช้งาน ทั้งที่สำเร็จและล้มเหลว
- **Data Isolation**: มีการตรวจสอบระดับหน่วยงาน (Department Check) เสมอก่อนดำเนินการใดๆ เพื่อป้องกันการเข้าถึงข้อมูลข้ามหน่วยงานโดยมิชอบ

## 4. โครงสร้างฐานข้อมูลสำคัญ (Key Schema)
- `User`: ข้อมูลผู้ใช้และลิงก์กับ LINE
- `Department`: โครงสร้างองค์กรและลำดับชั้น (Hierarchy)
- `Project`: ข้อมูลโครงการหลัก งบประมาณรวม และสถานะ
- `Report`: รายงานผลการดำเนินงานรายรอบ
- `IndicatorResult`: ผลการดำเนินงานจริงตามตัวชี้วัด
- `AuditLog`: บันทึกประวัติการเปลี่ยนแปลง (สำคัญมากสำหรับความโปร่งใส)

## 5. จุดเด่นของระบบ (System Highlights)
- **Data Integrity**: ระบบมีการคำนวณสะสม (Cumulative) ที่แม่นยำ ทำให้ทราบสถานะจริงของโครงการได้ทันที
- **Transparency**: ทุกการเปลี่ยนแปลงมีรอยนิ้วมือ (Audit Trail) ตรวจสอบย้อนกลับได้
- **UX Focused**: ดีไซน์ Responsive รองรับทั้ง Mobile และ Desktop พร้อมระบบ Floating Sidebar Toggle ที่สะดวกต่อการใช้งาน
- **Scalability**: โครงสร้างเป็นแบบ Modular สามารถขยายเพิ่มโมดูลอื่นๆ เช่น การเชื่อมต่อ Google Sheets หรือระบบประเมินผลเชิงลึกได้ในอนาคต

---
*จัดทำโดย: ระบบวิเคราะห์อัตโนมัติ (Antigravity AI)*
