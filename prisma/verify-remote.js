const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany({
      select: { name: true, price: true, stock: true },
    });
    console.log("REMOTE DATABASE - TOTAL PRODUCTS:", products.length)
    products.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name} | $${p.price} | Stock: ${p.stock}`);
    });
} catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();