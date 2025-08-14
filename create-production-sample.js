const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createProductionSampleApplication() {
  try {
    console.log('🌐 Creating sample application with real IP geolocation data...')
    
    // Simulate a real application from a production IP (using example data)
    const job = await prisma.job.findFirst({
      where: { status: 'ACTIVE' }
    })
    
    if (!job) {
      console.log('❌ No active jobs found. Please create a job first.')
      return
    }
    
    const sampleApplication = {
      candidateName: 'John Production User',
      candidateEmail: 'john.production@example.com',
      candidatePhone: '9876543210',
      jobId: job.id,
      formData: JSON.stringify([
        {
          label: 'Full Name',
          fieldType: 'TEXT',
          value: 'John Production User'
        },
        {
          label: 'Email Address',
          fieldType: 'EMAIL',
          value: 'john.production@example.com'
        },
        {
          label: 'Phone Number',
          fieldType: 'PHONE',
          value: '9876543210'
        },
        {
          label: 'Years of Experience',
          fieldType: 'SELECT',
          value: '3-5 years'
        },
        {
          label: 'Current Location',
          fieldType: 'TEXT',
          value: 'User provided: Mumbai, Maharashtra'
        }
      ]),
      // Simulate real IP geolocation data (Mumbai, India)
      candidateIP: '203.0.113.195', // Example IP (documentation range)
      candidateCity: 'Mumbai',
      candidateState: 'Maharashtra',
      candidateCountry: 'India',
      candidateLatitude: 19.0760,
      candidateLongitude: 72.8777
    }
    
    const application = await prisma.application.create({
      data: sampleApplication
    })
    
    console.log('✅ Sample production application created!')
    console.log(`Application ID: ${application.id}`)
    console.log(`Candidate: ${application.candidateName}`)
    console.log(`Location: ${application.candidateCity}, ${application.candidateState}, ${application.candidateCountry}`)
    console.log(`IP: ${application.candidateIP}`)
    console.log(`Coordinates: ${application.candidateLatitude}, ${application.candidateLongitude}`)
    console.log('\n🌐 View the application at:')
    console.log(`http://localhost:3000/applications/${application.id}`)
    
  } catch (error) {
    console.error('❌ Error creating sample application:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createProductionSampleApplication()
