// Check email logs for recent status change notifications
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkStatusChangeEmails() {
  try {
    console.log('📧 Checking Email Logs for Status Change Notifications...\n')

    // Get recent email logs
    const recentEmails = await prisma.emailLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 10
    })

    console.log(`Found ${recentEmails.length} recent email logs:`)
    console.log('======================================')

    if (recentEmails.length === 0) {
      console.log('❌ No email logs found')
    } else {
      recentEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.sentAt.toLocaleString()}`)
        console.log(`   To: ${email.to}`)
        console.log(`   Subject: ${email.subject}`)
        console.log(`   Status: ${email.status}`)
        console.log(`   Template: ${email.templateId || 'N/A'}`)
        console.log(`   Application: ${email.applicationId || 'N/A'}`)
        console.log('')
      })
    }

    // Check recent application status changes
    console.log('📊 Recent Application Status Changes:')
    console.log('====================================')
    
    const recentApplications = await prisma.application.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        status: true,
        updatedAt: true,
        job: {
          select: {
            title: true
          }
        }
      }
    })

    recentApplications.forEach((app, index) => {
      console.log(`${index + 1}. ${app.candidateName || 'Unknown'} - ${app.job.title}`)
      console.log(`   Status: ${app.status}`)
      console.log(`   Email: ${app.candidateEmail || 'Not set'}`)
      console.log(`   Updated: ${app.updatedAt.toLocaleString()}`)
      console.log(`   ID: ${app.id}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkStatusChangeEmails()
