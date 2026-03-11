import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const depts = await prisma.department.findMany({
    where: {
      OR: [
        { name: { contains: 'Unassigned', mode: 'insensitive' } },
        { code: { contains: 'TEMP', mode: 'insensitive' } },
        { code: { contains: 'UNASSIGNED', mode: 'insensitive' } },
      ]
    }
  })
  console.log('Found DEPARTMENTS:')
  console.log(depts)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
