import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
    {
        name: "📢 ประกาศทั่วไป",
        title: "ประกาศจากระบบ",
        message: "เรียนผู้ใช้งานทุกท่าน\n\n[รายละเอียดประกาศ]\n\nขอบคุณครับ",
        type: "INFO",
        link: null
    },
    {
        name: "🔧 แจ้งปิดปรับปรุงระบบ",
        title: "แจ้งปิดปรับปรุงระบบ",
        message: "เรียนผู้ใช้งานทุกท่าน\n\nระบบจะปิดปรับปรุงในวันที่ [วันที่] เวลา [เวลา] - [เวลา]\n\nเพื่อปรับปรุงประสิทธิภาพและเพิ่มฟีเจอร์ใหม่ๆ\n\nขออภัยในความไม่สะดวก",
        type: "WARNING",
        link: null
    },
    {
        name: "📋 มอบหมายโครงการใหม่",
        title: "คุณได้รับมอบหมายโครงการใหม่",
        message: "โครงการ: [ชื่อโครงการ]\n\nกรุณาตรวจสอบและดำเนินการตามกำหนด\n\nหากมีข้อสงสัยกรุณาติดต่อผู้บริหารโครงการ",
        type: "INFO",
        link: "/projects"
    },
    {
        name: "⏰ เตือนการประชุม",
        title: "เตือน: การประชุมในวันพรุ่งนี้",
        message: "การประชุม: [หัวข้อการประชุม]\n\nวันที่: [วันที่]\nเวลา: [เวลา]\nสถานที่: [สถานที่]\n\nกรุณามาตรงเวลา",
        type: "WARNING",
        link: null
    },
    {
        name: "✅ แจ้งอนุมัติโครงการ",
        title: "โครงการของคุณได้รับการอนุมัติแล้ว",
        message: "ยินดีด้วย!\n\nโครงการ: [ชื่อโครงการ]\n\nได้รับการอนุมัติจากผู้บริหาร สามารถเริ่มดำเนินการได้ทันที\n\nขอให้โครงการประสบความสำเร็จ",
        type: "SUCCESS",
        link: "/projects"
    },
    {
        name: "❌ แจ้งปฏิเสธ/ขอแก้ไข",
        title: "โครงการต้องปรับปรุงแก้ไข",
        message: "โครงการ: [ชื่อโครงการ]\n\nต้องการการปรับปรุงในส่วน:\n[รายละเอียดที่ต้องแก้ไข]\n\nกรุณาแก้ไขและส่งใหม่",
        type: "ERROR",
        link: "/projects"
    },
    {
        name: "📊 เตือนส่งรายงาน",
        title: "เตือน: ถึงกำหนดส่งรายงานความคืบหน้า",
        message: "โครงการ: [ชื่อโครงการ]\nรอบรายงาน: [รอบ]\n\nกรุณาส่งรายงานภายในวันที่ [วันที่]\n\nหากมีปัญหากรุณาติดต่อเจ้าหน้าที่",
        type: "WARNING",
        link: "/reports"
    },
    {
        name: "🎉 ขอบคุณ/ชมเชย",
        title: "ขอบคุณสำหรับการทำงานที่ยอดเยี่ยม!",
        message: "เรียน [ชื่อ]\n\nขอขอบคุณสำหรับการทำงานที่มีประสิทธิภาพในโครงการ [ชื่อโครงการ]\n\nผลงานของคุณเป็นแบบอย่างที่ดี\n\nขอให้ประสบความสำเร็จต่อไป",
        type: "SUCCESS",
        link: null
    }
];

async function seedTemplates() {
    console.log('🌱 Seeding notification templates...');

    for (const template of templates) {
        // Check if template already exists
        const existing = await prisma.notificationTemplate.findFirst({
            where: { name: template.name }
        });

        if (!existing) {
            await prisma.notificationTemplate.create({
                data: template
            });
            console.log(`✅ Created template: ${template.name}`);
        } else {
            console.log(`⏭️  Skipped (already exists): ${template.name}`);
        }
    }

    console.log('✨ Template seeding completed!');
}

// Run if called directly
if (require.main === module) {
    seedTemplates()
        .catch((e) => {
            console.error('❌ Error seeding templates:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

export { seedTemplates };
