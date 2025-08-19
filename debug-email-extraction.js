// Debug why emails aren't being sent for status changes
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugEmailIssue() {
  try {
    console.log('🔍 Debugging Status Change Email Issue...\n')

    // Get a recent application to examine its data structure
    const applications = await prisma.application.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 3,
      include: {
        job: true
      }
    })

    console.log(`Found ${applications.length} recent applications:\n`)

    applications.forEach((app, index) => {
      console.log(`${index + 1}. Application ID: ${app.id}`)
      console.log(`   Candidate Name: ${app.candidateName || 'Not in field'}`)
      console.log(`   Candidate Email: ${app.candidateEmail || 'Not in field'}`)
      console.log(`   Status: ${app.status}`)
      console.log(`   Job: ${app.job.title}`)
      console.log(`   Updated: ${app.updatedAt.toLocaleString()}`)
      
      // Parse and examine form data
      let formData = {}
      try {
        formData = JSON.parse(app.formData)
        console.log(`   Form Data Keys:`, Object.keys(formData))
        
        // Look for email in form data
        for (const [key, value] of Object.entries(formData)) {
          if (typeof value === 'string' && value.includes('@')) {
            console.log(`   📧 Email found in form: ${key} = ${value}`)
          }
        }
      } catch (error) {
        console.log(`   ❌ Form data parse error:`, error.message)
      }
      
      console.log('')
    })

    // Check recent email logs
    console.log('📧 Recent Email Logs:')
    console.log('====================')
    const recentEmails = await prisma.emailLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 5
    })

    if (recentEmails.length === 0) {
      console.log('❌ No recent email logs found')
    } else {
      recentEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.sentAt.toLocaleString()}`)
        console.log(`   To: ${email.to}`)
        console.log(`   Subject: ${email.subject}`)
        console.log(`   Status: ${email.status}`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('❌ Debug Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debugEmailIssue()
