import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Database Seed Script
 * Usage: npm run db:seed
 * 
 * This script creates initial data for development/testing:
 * - Admin user
 * - Sample customer
 * - Sample products
 */
async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin User",
      role: "admin",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create sample customer
  const customerPassword = await bcrypt.hash("customer123", 10);
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      password: customerPassword,
      name: "Sample Customer",
      role: "customer",
    },
  });
  console.log("✅ Customer created:", customer.email);

  // Create sample products
  const sampleProducts = [
    {
      name: "Sample Product 1",
      description: "This is a sample product for demonstration",
      price: 29.99,
      stock: 100,
      owner_id: admin.id,
    },
    {
      name: "Sample Product 2",
      description: "Another sample product",
      price: 49.99,
      stock: 50,
      owner_id: admin.id,
    },
    {
      name: "Sample Product 3",
      description: "A third sample product",
      price: 19.99,
      stock: 200,
      owner_id: admin.id,
    },
  ];

  for (const product of sampleProducts) {
    const created = await prisma.product.upsert({
      where: { id: product.name }, // Using name as unique identifier for upsert
      update: {},
      create: product,
    });
    console.log("✅ Product created:", created.name);
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
