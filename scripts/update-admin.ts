import prisma from "../src/lib/prisma";

/**
 * Utility script to update a user's role to admin
 * Usage: npx ts-node scripts/update-admin.ts [email]
 */
async function main() {
  const email = process.argv[2] || "testadmin@example.com";

  const user = await prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });

  console.log(`User "${email}" updated to admin:`, user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
