
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const id = 3;
    console.log(`Checking project with ID: ${id} WITH RELATIONS`);
    try {
        const project = await prisma.project.findUnique({
            where: { id: id },
            include: {
                department: true,
                // projectCategory: true, // Commented out in service too
                developmentGoal: {
                    include: {
                        issue: {
                            include: {
                                annualPlan: true,
                            },
                        },
                    },
                },
                ownerUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                indicators: true, // This is the new part
            },
        });

        if (project) {
            console.log("Project found with relations:", JSON.stringify(project, null, 2));
        } else {
            console.log("Project NOT found (returned null)");
        }
    } catch (err) {
        console.error("Error fetching project:", err);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
