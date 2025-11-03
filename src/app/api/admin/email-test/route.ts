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
  customTemplate?: string
  customSubject?: string
}

export async function POST(request: NextRequest) {
  try {
    const requestBody: EmailTestRequest = await request.json()
    const { status, roles, testEmail, templateId, recipients, customTemplate, customSubject } = requestBody

    console.log('Email test request:', { status, roles, recipientCount: recipients.length, hasCustomTemplate: !!customTemplate })

    // Validate required fields - adjust validation for new recipient modes
    if (!status || !templateId || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: status, templateId, and at least one recipient are required' },
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
    let subject = customSubject || template.subject
    let emailBody = customTemplate || template.body

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
        ${roles.length > 0 ? `<strong>Target Roles:</strong> ${roles.join(', ')}<br>` : ''}
        ${customTemplate ? '<strong>Using Custom Template:</strong> Yes<br>' : ''}
        ${customSubject ? '<strong>Using Custom Subject:</strong> Yes<br>' : ''}
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

    // Remove the additional test email handling since it's now handled in recipients array
    // Send to system users with selected roles is now handled in the main recipients loop

    // Log the test activity
    try {
      await prisma.emailLog.create({
        data: {
          to: recipients.map(r => r.email).join(', '),
          subject: `[EMAIL TEST] ${status} notification`,
          body: `Email test performed for status: ${status}${roles.length > 0 ? `, roles: ${roles.join(', ')}` : ''}, recipients: ${emailsSent}${customTemplate ? ' (custom template used)' : ''}`,
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
      totalRecipients: recipients.length,
      results: emailResults,
      template: {
        name: template.name,
        type: template.type,
        subject: template.subject,
        customUsed: !!customTemplate
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
