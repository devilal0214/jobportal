const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApplicationsByStatus() {
  try {
    const allApps = await prisma.application.findMany({
      select: { status: true, candidateName: true }
    });
    
    console.log('Total applications:', allApps.length);
    
    const statusCounts = {};
    allApps.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });
    
    console.log('\nApplications by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
    
    console.log('\nAll applications:');
    allApps.forEach(app => {
      console.log(`- ${app.candidateName}: ${app.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApplicationsByStatus();
