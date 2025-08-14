import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ExtendedApplication {
  candidateName?: string
  candidateEmail?: string
  candidatePhone?: string
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status }
    })

    // Get candidate information for email
    const extendedApp = application as ExtendedApplication
    const candidateName = extendedApp.candidateName || 'Candidate'
    const candidateEmail = extendedApp.candidateEmail || ''
    
    // Parse form data to get additional info if needed
    let formData: Record<string, unknown> = {}
    try {
      formData = JSON.parse(application.formData)
    } catch (error) {
      console.error('Error parsing form data:', error)
    }

    // Extract email from form data if not in application
    let emailToSend = candidateEmail
    if (!emailToSend) {
      for (const [, value] of Object.entries(formData)) {
        if (typeof value === 'string' && value.includes('@')) {
          emailToSend = value
          break
        }
      }
    }

    // Create email content based on status
    let emailSubject = ''
    let emailBody = ''
    
    switch (status) {
      case 'SELECTED':
        emailSubject = `Congratulations! Your application for ${application.job.title} has been accepted`
        emailBody = `
Dear ${candidateName},

We are pleased to inform you that your application for the position of ${application.job.title} has been accepted.

Application Details:
- Position: ${application.job.title}
- Application ID: ${application.id}
- Status: Accepted
- Applied Date: ${application.createdAt.toLocaleDateString()}

We will contact you soon with the next steps.

Best regards,
HR Team
        `
        break
      case 'REJECTED':
        emailSubject = `Update on your application for ${application.job.title}`
        emailBody = `
Dear ${candidateName},

Thank you for your interest in the position of ${application.job.title}.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.

Application Details:
- Position: ${application.job.title}
- Application ID: ${application.id}
- Status: Not selected
- Applied Date: ${application.createdAt.toLocaleDateString()}

We encourage you to apply for future opportunities that match your skills and experience.

Best regards,
HR Team
        `
        break
      case 'UNDER_REVIEW':
        emailSubject = `Your application for ${application.job.title} is under review`
        emailBody = `
Dear ${candidateName},

We have received your application for the position of ${application.job.title} and it is currently under review.

Application Details:
- Position: ${application.job.title}
- Application ID: ${application.id}
- Status: Under Review
- Applied Date: ${application.createdAt.toLocaleDateString()}

We will notify you of any updates regarding your application status.

Best regards,
HR Team
        `
        break
      case 'INTERVIEW':
        emailSubject = `Interview scheduled for ${application.job.title} position`
        emailBody = `
Dear ${candidateName},

Congratulations! You have been shortlisted for an interview for the position of ${application.job.title}.

Application Details:
- Position: ${application.job.title}
- Application ID: ${application.id}
- Status: Interview Scheduled
- Applied Date: ${application.createdAt.toLocaleDateString()}

We will contact you soon with the interview details.

Best regards,
HR Team
        `
        break
    }

    // Log the email (in a real system, you would send the actual email)
    if (emailToSend && emailSubject && emailBody) {
      try {
        await prisma.emailLog.create({
          data: {
            to: emailToSend,
            subject: emailSubject,
            body: emailBody,
            status: 'sent'
          }
        })
      } catch (emailError) {
        console.error('Error logging email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status
      },
      emailSent: !!emailToSend
    })

  } catch (error) {
    console.error('Status update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
