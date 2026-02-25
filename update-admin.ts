import prisma from "./src/lib/prisma";

async function main() {
  const user = await prisma.user.update({
    where: { email: "testadmin@example.com" },
    data: { role: "admin" },
  });
  console.log("User updated to admin:", user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
