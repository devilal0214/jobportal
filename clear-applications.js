import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearApplications() {
  try {
    // Delete all applications
    await prisma.application.deleteMany({})
    console.log('All applications deleted successfully!')
    
    // Create a test application with the new labeled format
    const testJob = await prisma.job.findFirst({
      where: { title: 'Senior Software Developer' }
    })
    
    if (testJob) {
      const labeledData = {
        'Full Name': 'John Smith',
        'Email Address': 'john.smith@example.com',
        'Phone Number': '+1234567890',
        'Years of Experience': '3-5 years',
        'Technical Skills': JSON.stringify([
          { skill: 'JavaScript', rating: 5 },
          { skill: 'TypeScript', rating: 4 },
          { skill: 'React', rating: 5 },
          { skill: 'Node.js', rating: 4 },
          { skill: 'Python', rating: 3 }
        ]),
        'Upload Resume/CV': JSON.stringify({
          fileName: 'john_smith_resume.pdf',
          originalName: 'John Smith Resume.pdf',
          path: '/uploads/john_smith_resume.pdf'
        }),
        'Portfolio URL': 'https://johnsmith.dev',
        'GitHub Profile': 'https://github.com/johnsmith',
        'Cover Letter': 'I am excited to apply for this Senior Software Developer position. With 4+ years of experience in full-stack development, I have worked extensively with modern JavaScript frameworks and backend technologies. I am passionate about writing clean, maintainable code and solving complex problems.',
        'Portfolio Links': ['https://project1.johnsmith.dev', 'https://project2.johnsmith.dev']
      }
      
      await prisma.application.create({
        data: {
          jobId: testJob.id,
          candidateName: 'John Smith',
          candidateEmail: 'john.smith@example.com',
          candidatePhone: '+1234567890',
          status: 'PENDING',
          resumePath: '/uploads/john_smith_resume.pdf',
          formData: JSON.stringify(labeledData)
        }
      })
      
      console.log('Created test application with labeled data!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearApplications()
