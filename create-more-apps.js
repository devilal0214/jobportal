const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMoreTestApplications() {
  try {
    // Get all jobs
    const jobs = await prisma.job.findMany();
    console.log(`Found ${jobs.length} jobs`);

    // Create multiple applications for different jobs
    const applications = [
      {
        candidateName: 'John Smith',
        candidateEmail: 'john.smith@example.com',
        formData: JSON.stringify({
          'Full Name': 'John Smith',
          'Email Address': 'john.smith@example.com',
          'Phone Number': '555-0101'
        })
      },
      {
        candidateName: 'Sarah Johnson',
        candidateEmail: 'sarah.johnson@example.com',
        formData: JSON.stringify({
          'Full Name': 'Sarah Johnson',
          'Email Address': 'sarah.johnson@example.com',
          'Phone Number': '555-0102'
        })
      },
      {
        candidateName: 'Mike Davis',
        candidateEmail: 'mike.davis@example.com',
        formData: JSON.stringify({
          'Full Name': 'Mike Davis',
          'Email Address': 'mike.davis@example.com',
          'Phone Number': '555-0103'
        })
      },
      {
        candidateName: 'Emily Wilson',
        candidateEmail: 'emily.wilson@example.com',
        formData: JSON.stringify({
          'Full Name': 'Emily Wilson',
          'Email Address': 'emily.wilson@example.com',
          'Phone Number': '555-0104'
        })
      }
    ];

    for (let i = 0; i < applications.length && i < jobs.length; i++) {
      const job = jobs[i];
      const appData = applications[i];
      
      await prisma.application.create({
        data: {
          jobId: job.id,
          candidateName: appData.candidateName,
          candidateEmail: appData.candidateEmail,
          status: 'PENDING',
          formData: appData.formData
        }
      });

      console.log(`Created application: ${appData.candidateName} for ${job.title}`);
    }

    // Create additional applications for some jobs to show higher counts
    for (let i = 0; i < 2 && i < jobs.length; i++) {
      const job = jobs[i];
      
      await prisma.application.create({
        data: {
          jobId: job.id,
          candidateName: `Additional Candidate ${i + 1}`,
          candidateEmail: `additional${i + 1}@example.com`,
          status: 'PENDING',
          formData: JSON.stringify({
            'Full Name': `Additional Candidate ${i + 1}`,
            'Email Address': `additional${i + 1}@example.com`,
            'Phone Number': `555-020${i + 1}`
          })
        }
      });

      console.log(`Created additional application for ${job.title}`);
    }

    // Show final counts
    console.log('\nFinal application counts:');
    const jobsWithCounts = await prisma.job.findMany({
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    jobsWithCounts.forEach(job => {
      console.log(`${job.title}: ${job._count.applications} applications`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMoreTestApplications();
