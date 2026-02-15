// @ts-check

const { PrismaClient, Priority, Status } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const demoUser = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@taskflow.local",
      image: null,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        ownerId: demoUser.id,
        title: "Plan sprint goals",
        notes: "Prepare goals and risks for Monday standup.",
        dueAt: new Date("2026-02-16T09:00:00.000Z"),
        priority: Priority.HIGH,
        status: Status.OPEN,
      },
      {
        ownerId: demoUser.id,
        title: "Refine task filters",
        notes: "Review all / today / week / overdue logic.",
        dueAt: new Date("2026-02-17T14:00:00.000Z"),
        priority: Priority.MEDIUM,
        status: Status.OPEN,
      },
      {
        ownerId: demoUser.id,
        title: "Share milestone update",
        notes: "Post branch links and PR status.",
        dueAt: new Date("2026-02-14T17:00:00.000Z"),
        priority: Priority.LOW,
        status: Status.DONE,
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
