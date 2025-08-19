const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function scanProject() {
  try {
    console.log('🔍 Job Portal Project Scan');
    console.log('==========================');
    
    const [userCount, jobCount, appCount, formCount, roleCount] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.application.count(),
      prisma.formField.count(),
      prisma.role.count()
    ]);
    
    console.log(`📊 Database Statistics:`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Jobs: ${jobCount}`);
    console.log(`- Applications: ${appCount}`);
    console.log(`- Form Fields: ${formCount}`);
    console.log(`- Roles: ${roleCount}`);
    
    // Get recent applications if any
    if (appCount > 0) {
      const recentApps = await prisma.application.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { title: true } },
          user: { select: { name: true, email: true } }
        }
      });
      
      console.log(`\n📋 Recent Applications:`);
      recentApps.forEach(app => {
        console.log(`- ${app.user?.name || 'Unknown'} applied for ${app.job?.title || 'Unknown Job'} (${app.status})`);
      });
    }
    
    // Get active jobs if any
    if (jobCount > 0) {
      const activeJobs = await prisma.job.findMany({
        where: { status: 'ACTIVE' },
        take: 3,
        select: { title: true, location: true, type: true }
      });
      
      console.log(`\n💼 Active Jobs:`);
      activeJobs.forEach(job => {
        console.log(`- ${job.title} (${job.type}) in ${job.location}`);
      });
    }
    
  } catch (error) {
    console.error('Error scanning project:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

scanProject();
