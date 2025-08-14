const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatuses() {
  try {
    const apps = await prisma.application.findMany({
      select: { status: true }
    });
    
    const statuses = [...new Set(apps.map(a => a.status))];
    console.log('Unique statuses in database:', statuses);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatuses();
