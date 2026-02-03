const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.findUnique({
    where: { name: "Manager" },
    include: { permissions: { include: { permission: true } } },
  });

  if (!role) {
    console.log("Manager role not found");
    process.exit(0);
  }

  console.log("Role:", role.name);
  console.log("Permissions:");
  for (const rp of role.permissions) {
    console.log(
      `- ${rp.permission.module}:${rp.permission.action} (granted=${rp.granted})`,
    );
  }

  const users = await prisma.user.findMany({
    where: { roleId: role.id },
    select: { id: true, email: true, name: true },
  });
  console.log("\nAssigned users:");
  users.forEach((u) => console.log(`- ${u.email} (${u.name})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
