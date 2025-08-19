// Test candidates API
const testCandidatesAPI = async () => {
  try {
    // You'll need to replace this with a valid token from your browser
    const token = 'YOUR_TOKEN_HERE'
    
    const response = await fetch('http://localhost:3000/api/admin/candidates', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// For now, let's just check if we have applications
const checkApplications = async () => {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    const applications = await prisma.application.findMany({
      include: {
        applicant: true,
        job: true
      },
      take: 5
    })
    
    console.log('Sample applications:')
    applications.forEach(app => {
      console.log(`- ${app.candidateEmail || app.applicant?.email} for ${app.job.title}`)
    })
    
    const totalApps = await prisma.application.count()
    console.log(`\nTotal applications: ${totalApps}`)
    
  } catch (error) {
    console.error('Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkApplications()
