const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.product.count();
  console.log("Products count:", count);
  await prisma.$disconnect();
}

main();
