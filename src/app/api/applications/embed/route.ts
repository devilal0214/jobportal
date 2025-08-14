import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { jobId, formData, sourceInfo, fieldLabels } = await request.json()

    if (!jobId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get job with form details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        form: {
          include: {
            fields: {
              orderBy: { order: 'asc' }
            }
          }
        },
        assignee: true
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      )
    }

    // Create a mapping of field IDs to labels for transformation
    const fieldIdToLabel: Record<string, string> = {}
    // Type assertion for accessing included relations
    const jobWithForm = job as typeof job & {
      form?: {
        fields: { id: string; label: string; isRequired: boolean }[]
      }
      assignee?: { email: string }
      department?: string
    }
    
    if (jobWithForm.form?.fields) {
      jobWithForm.form.fields.forEach((field: { id: string; label: string }) => {
        fieldIdToLabel[field.id] = field.label
      })
    }

    // Transform formData from field IDs to labels (same as main application submission)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labeledFormData: Record<string, any> = {}
    
    for (const [fieldId, value] of Object.entries(formData)) {
      if (fieldId === 'portfolioLinks') {
        labeledFormData['Portfolio Links'] = value
        continue
      }
      
      const label = fieldIdToLabel[fieldId] || fieldLabels?.[fieldId] || fieldId
      labeledFormData[label] = value
    }

    // Extract candidate info from labeled form data (same logic as main submission)
    let candidateName = 'Anonymous'
    let candidateEmail = ''
    let candidatePhone = ''
    let resumeFileName = ''
    let resumePath = ''

    // Look for common field labels and extract candidate info
    for (const [label, value] of Object.entries(labeledFormData)) {
      if (typeof value === 'string') {
        const lowerLabel = label.toLowerCase()
        
        // Match name fields
        if ((lowerLabel.includes('name') || lowerLabel.includes('full name')) && candidateName === 'Anonymous') {
          candidateName = value
        }
        // Match email fields
        else if ((lowerLabel.includes('email') || value.includes('@')) && candidateEmail === '') {
          candidateEmail = value
        }
        // Match phone fields
        else if ((lowerLabel.includes('phone') || lowerLabel.includes('mobile') || lowerLabel.includes('contact')) && candidatePhone === '') {
          candidatePhone = value
        }
        // Check if it's a file upload (JSON format)
        else if ((lowerLabel.includes('resume') || lowerLabel.includes('cv') || lowerLabel.includes('upload')) && value.startsWith('{') && value.includes('fileName')) {
          try {
            const fileData = JSON.parse(value)
            if (fileData.fileName && fileData.path) {
              resumeFileName = fileData.fileName
              resumePath = fileData.path
            }
          } catch {
            // Not a valid file JSON, continue
          }
        }
      }
    }

    // Validate form data if form exists (using field IDs for validation, but store labeled data)
    if (jobWithForm.form) {
      for (const field of jobWithForm.form.fields) {
        if (field.isRequired) {
          const value = formData[field.id]
          if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
            return NextResponse.json(
              { error: `${field.label} is required` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Create application with labeled data and source tracking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const application = await (prisma.application as any).create({
      data: {
        jobId,
        candidateName,
        candidateEmail,
        candidatePhone,
        resume: resumeFileName,
        resumePath: resumePath,
        coverLetter: labeledFormData['Cover Letter'] || '',
        status: 'PENDING',
        formData: JSON.stringify(labeledFormData),
        // Add source tracking fields
        sourceDomain: sourceInfo?.domain || '',
        sourceUrl: sourceInfo?.pageUrl || '',
        userAgent: sourceInfo?.userAgent || ''
      }
    })

    // Send notification emails
    try {
      // Email to candidate
      if (formData.email) {
        await emailService.sendEmail({
          to: formData.email,
          subject: `Application Received - ${job.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Application Received</h2>
              <p>Dear ${formData.name || 'Candidate'},</p>
              <p>Thank you for your interest in the <strong>${job.title}</strong> position.</p>
              <p>We have received your application and will review it shortly. You will hear from us within the next few business days.</p>
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin-top: 0; color: #374151;">Application Details:</h3>
                <p><strong>Position:</strong> ${job.title}</p>
                <p><strong>Department:</strong> ${jobWithForm.department || 'Not specified'}</p>
                <p><strong>Application ID:</strong> ${application.id}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>Best regards,<br>HR Team</p>
            </div>
          `,
          applicationId: application.id
        })
      }

      // Email to assigned HR/Manager
      if (jobWithForm.assignee?.email) {
        await emailService.sendEmail({
          to: jobWithForm.assignee.email,
          subject: `New Application - ${job.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Application Received</h2>
              <p>A new application has been submitted for the <strong>${job.title}</strong> position.</p>
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin-top: 0; color: #374151;">Candidate Information:</h3>
                <p><strong>Name:</strong> ${formData.name || 'Not provided'}</p>
                <p><strong>Email:</strong> ${formData.email || 'Not provided'}</p>
                <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
                <p><strong>Application ID:</strong> ${application.id}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                ${sourceInfo?.domain ? `<p><strong>Source:</strong> ${sourceInfo.domain}</p>` : ''}
                ${sourceInfo?.pageUrl ? `<p><strong>Page URL:</strong> ${sourceInfo.pageUrl}</p>` : ''}
              </div>
              <div style="margin: 24px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/applications/${application.id}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Application
                </a>
              </div>
            </div>
          `,
          applicationId: application.id
        })
      }
    } catch (emailError) {
      console.error('Failed to send notification emails:', emailError)
      // Don't fail the application submission due to email issues
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: 'Application submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting application:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
