import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestApplication() {
  try {
    // Create a test application with skills data
    const testApplication = await prisma.application.create({
      data: {
        jobId: 'cmdx409mq000b5ju0do6w056l', // The job we just created
        candidateName: 'John Doe',
        candidateEmail: 'john.doe@example.com',
        candidatePhone: '+1234567890',
        status: 'PENDING',
        resumePath: '/uploads/john_doe_resume.pdf',
        formData: JSON.stringify({
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          experience: '3-5 years',
          skills: {
            'JavaScript': 5,
            'TypeScript': 4,
            'React': 5,
            'Node.js': 4,
            'Python': 3,
            'SQL': 4,
            'AWS': 3,
            'Docker': 3,
            'Git': 5
          },
          resume: {
            fileName: 'john_doe_resume.pdf',
            originalName: 'John Doe Resume.pdf',
            path: '/uploads/john_doe_resume.pdf'
          },
          portfolio: 'https://johndoe.dev',
          github: 'https://github.com/johndoe',
          cover_letter: 'I am excited to apply for the Senior Software Developer position. With over 3 years of experience in full-stack development, I have worked extensively with JavaScript, TypeScript, and React. I am passionate about building scalable web applications and would love to contribute to your team.'
        }),
        createdAt: new Date()
      }
    })

    console.log('Created test application:', testApplication)

    // Create another test application with different skills
    const testApplication2 = await prisma.application.create({
      data: {
        jobId: 'cmdx409mq000b5ju0do6w056l',
        candidateName: 'Jane Smith',
        candidateEmail: 'jane.smith@example.com', 
        candidatePhone: '+1987654321',
        status: 'UNDER_REVIEW',
        resumePath: '/uploads/jane_smith_resume.pdf',
        formData: JSON.stringify({
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1987654321',
          experience: '5+ years',
          skills: {
            'JavaScript': 4,
            'TypeScript': 5,
            'React': 4,
            'Node.js': 5,
            'Java': 5,
            'C#': 4,
            'SQL': 5,
            'MongoDB': 4,
            'AWS': 4,
            'Docker': 4,
            'Git': 5
          },
          resume: {
            fileName: 'jane_smith_resume.pdf',
            originalName: 'Jane Smith Resume.pdf',
            path: '/uploads/jane_smith_resume.pdf'
          },
          portfolio: 'https://janesmith.io',
          github: 'https://github.com/janesmith',
          cover_letter: 'As a senior software developer with 5+ years of experience, I am excited about the opportunity to join your team. I have extensive experience in both frontend and backend development, with particular expertise in TypeScript, Node.js, and cloud technologies.'
        }),
        createdAt: new Date()
      }
    })

    console.log('Created second test application:', testApplication2)

  } catch (error) {
    console.error('Error creating test applications:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestApplication()
