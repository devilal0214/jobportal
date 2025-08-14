const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestApplication() {
  try {
    // Get the first job
    const job = await prisma.job.findFirst();
    if (!job) {
      console.log('No jobs found');
      return;
    }

    // Create a test application
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateName: 'Test Candidate',
        candidateEmail: 'test@example.com',
        status: 'PENDING',
        formData: JSON.stringify({
          'Full Name': 'Test Candidate',
          'Email Address': 'test@example.com',
          'Phone Number': '123-456-7890'
        })
      }
    });

    console.log('Test application created:', application.candidateName);
    console.log('For job:', job.title);

    // Now check the count
    const jobWithCount = await prisma.job.findUnique({
      where: { id: job.id },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    console.log(`Job now has ${jobWithCount._count.applications} applications`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestApplication();
