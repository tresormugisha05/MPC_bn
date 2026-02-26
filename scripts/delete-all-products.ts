import prisma from "../src/lib/prisma";

async function deleteAllProducts() {
  console.log("Starting to delete all products...");

  try {
    // First, let's see how many products we have
    const productCount = await prisma.product.count();
    console.log(`Found ${productCount} products to delete.`);

    if (productCount === 0) {
      console.log("No products to delete.");
      return;
    }

    // Delete related records first (reservations, orders, inventory logs)
    // that reference products to avoid foreign key constraint violations
    console.log("Deleting related reservations...");
    await prisma.reservation.deleteMany({});
    
    console.log("Deleting related orders...");
    await prisma.order.deleteMany({});
    
    console.log("Deleting related inventory logs...");
    await prisma.inventoryLog.deleteMany({});

    // Now delete all products
    const result = await prisma.product.deleteMany({});

    console.log(`Successfully deleted ${result.count} products.`);
    
    // Verify
    const afterCount = await prisma.product.count();
    console.log(`Products remaining: ${afterCount}`);
  } catch (error) {
    console.error("Error deleting products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllProducts();
