import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'
import { prisma } from '@/lib/prisma'

interface EmailTestRequest {
  status: string
  roles: string[]
  testEmail?: string
  templateId: string
  recipients: Array<{
    id: string
    email: string
    name: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const requestBody: EmailTestRequest = await request.json()
    const { status, roles, testEmail, templateId, recipients } = requestBody

    console.log('Email test request:', { status, roles, recipientCount: recipients.length })

    // Validate required fields
    if (!status || !roles.length || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields: status, roles, and templateId are required' },
        { status: 400 }
      )
    }

    // Get the email template
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template || !template.isActive) {
      return NextResponse.json(
        { error: 'Email template not found or inactive' },
        { status: 404 }
      )
    }

    let emailsSent = 0
    const emailResults: Array<{ email: string, success: boolean, error?: string }> = []

    // Prepare email variables for status change
    const emailVariables = {
      applicant_name: 'Test Candidate',
      job_title: 'Sample Job Position',
      status: status,
      remarks: 'This is a test email',
      application_id: 'TEST-' + Date.now(),
      company_name: 'Job Portal',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    }

    // Replace variables in template
    let subject = template.subject
    let emailBody = template.body

    Object.entries(emailVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), value)
      emailBody = emailBody.replace(new RegExp(placeholder, 'g'), value)
    })

    // Add test notice to email
    const testNotice = `
      <div style="background-color: #fef3cd; border: 1px solid #faebcc; color: #8a6d3b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <strong>🧪 EMAIL TEST:</strong> This is a test email sent from the Job Portal admin panel.<br>
        <strong>Status:</strong> ${status}<br>
        <strong>Target Roles:</strong> ${roles.join(', ')}<br>
        <strong>Sent at:</strong> ${new Date().toLocaleString()}
      </div>
    `
    emailBody = testNotice + emailBody

    // Send to system users with selected roles
    for (const recipient of recipients) {
      try {
        const success = await emailService.sendEmail({
          to: recipient.email,
          subject: `[TEST] ${subject}`,
          html: emailBody,
          templateId: template.id,
          userId: recipient.id
        })

        emailResults.push({
          email: recipient.email,
          success
        })

        if (success) {
          emailsSent++
        }

      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error)
        emailResults.push({
          email: recipient.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Send to additional test email if provided
    if (testEmail && testEmail.includes('@')) {
      try {
        const success = await emailService.sendEmail({
          to: testEmail,
          subject: `[TEST] ${subject}`,
          html: emailBody,
          templateId: template.id
        })

        emailResults.push({
          email: testEmail,
          success
        })

        if (success) {
          emailsSent++
        }

      } catch (error) {
        console.error(`Failed to send email to ${testEmail}:`, error)
        emailResults.push({
          email: testEmail,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Log the test activity
    try {
      await prisma.emailLog.create({
        data: {
          to: recipients.map(r => r.email).join(', ') + (testEmail ? `, ${testEmail}` : ''),
          subject: `[EMAIL TEST] ${status} notification`,
          body: `Email test performed for status: ${status}, roles: ${roles.join(', ')}, recipients: ${emailsSent}`,
          status: emailsSent > 0 ? 'sent' : 'failed',
          templateId: template.id
        }
      })
    } catch (logError) {
      console.error('Failed to log email test:', logError)
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      totalRecipients: recipients.length + (testEmail ? 1 : 0),
      results: emailResults,
      template: {
        name: template.name,
        type: template.type,
        subject: template.subject
      }
    })

  } catch (error) {
    console.error('Email test API error:', error)
    return NextResponse.json(
      { error: 'Internal server error while sending test emails' },
      { status: 500 }
    )
  }
}
