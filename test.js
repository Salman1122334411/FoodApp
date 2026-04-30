const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.restaurant.findFirst({
    where: { operatingHours: { not: null } },
    select: { name: true, operatingHours: true },
  });
  console.log("HOURS:", JSON.stringify(res, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
