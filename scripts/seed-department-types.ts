// Script to seed department types
import db from "../src/lib/db";

async function seedDepartmentTypes() {
    const types = [
        { code: "GOV", name: "หน่วยงานภาครัฐ" },
        { code: "PRIVATE", name: "ภาคเอกชน" },
        { code: "CIVIL", name: "ภาคประชาสังคม" },
        { code: "LOCAL", name: "อปท. (องค์กรปกครองส่วนท้องถิ่น)" },
    ];

    console.log("Seeding Department Types...\n");

    for (const type of types) {
        const existing = await db.departmentType.findUnique({
            where: { code: type.code },
        });

        if (existing) {
            console.log(`⏭️  ${type.code} already exists, skipping`);
        } else {
            await db.departmentType.create({ data: type });
            console.log(`✅ Created: ${type.code} - ${type.name}`);
        }
    }

    console.log("\nDone! Department types seeded.");
}

seedDepartmentTypes()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
