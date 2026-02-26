import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Resetting admin user password...");

  const adminEmail = "admin@example.com";
  const newPassword = "admin123";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email: adminEmail },
    data: { password: hashedPassword },
  });

  console.log("✅ Admin password reset successfully!");
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
}

main()
  .catch((e) => {
    console.error("❌ Error resetting password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
