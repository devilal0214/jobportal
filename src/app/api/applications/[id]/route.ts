import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email'

const emailService = new EmailService()

interface ExtendedApplication {
  candidateName?: string
  candidateEmail?: string
  candidatePhone?: string
  resume?: string
  resumePath?: string
  candidateCity?: string
  candidateState?: string
  candidateCountry?: string
  candidateLatitude?: number
  candidateLongitude?: number
  candidateIP?: string
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Parse form data (now stored with labels as keys)
    let formData: Record<string, unknown> = {}
    try {
      formData = JSON.parse(application.formData)
    } catch (error) {
      console.error('Error parsing form data:', error)
      formData = {}
    }

    // Extract candidate info from application fields and form data
    let candidateName = 'Unknown'
    let candidateEmail = 'unknown@email.com'
    let candidatePhone = ''

    const extendedApp = application as ExtendedApplication

    // Try to extract from stored fields first
    if (extendedApp.candidateName) candidateName = extendedApp.candidateName
    if (extendedApp.candidateEmail) candidateEmail = extendedApp.candidateEmail
    if (extendedApp.candidatePhone) candidatePhone = extendedApp.candidatePhone

    // For new labeled data format, extract from well-known labels
    if (candidateName === 'Unknown' || candidateEmail === 'unknown@email.com') {
      for (const [label, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
          const lowerLabel = label.toLowerCase()
          
          // Match name fields
          if ((lowerLabel.includes('name') || lowerLabel.includes('full name')) && candidateName === 'Unknown') {
            candidateName = value
          }
          // Match email fields
          else if ((lowerLabel.includes('email') || value.includes('@')) && candidateEmail === 'unknown@email.com') {
            candidateEmail = value
          }
          // Match phone fields
          else if ((lowerLabel.includes('phone') || lowerLabel.includes('mobile') || lowerLabel.includes('contact')) && candidatePhone === '') {
            candidatePhone = value
          }
        }
      }
    }

    // Create properly formatted form data for display
    // Since data is now stored with labels as keys, we can use them directly
    let formattedFormData: Array<{
      id: string
      label: string
      fieldType: string
      value: string | string[]
    }> = []
    
    if (Object.keys(formData).length > 0) {
      formattedFormData = Object.entries(formData)
        .filter(([key]) => !['Portfolio Links'].includes(key))
        .map(([label, value], index) => {
          let fieldType = 'TEXT'
          
          if (typeof value === 'string') {
            const lowerLabel = label.toLowerCase()
            
            if (value.includes('@')) {
              fieldType = 'EMAIL'
            } else if (/^\+?[\d\s\-\(\)]+$/.test(value) && value.length >= 10) {
              fieldType = 'TEL'
            } else if (lowerLabel.includes('skill') && value.startsWith('[')) {
              fieldType = 'SKILLS'
            } else if (value.length > 100) {
              fieldType = 'TEXTAREA'
            } else if (lowerLabel.includes('experience') || lowerLabel.includes('years')) {
              fieldType = 'SELECT'
            } else if (value.startsWith('{') && value.includes('fileName')) {
              fieldType = 'FILE'
            } else if (value.startsWith('http')) {
              fieldType = 'URL'
            }
          } else if (Array.isArray(value)) {
            fieldType = 'TAGS'
          }
          
          return {
            id: `field_${index}`,
            label,
            fieldType,
            value: value as string | string[]
          }
        })
    }

    // Extract portfolio links separately - handle both old format (strings) and new format (objects)
    let portfolioLinks: (string | { name: string; url: string })[] = [];
    if (formData['Portfolio Links'] && Array.isArray(formData['Portfolio Links'])) {
      portfolioLinks = formData['Portfolio Links']
        .filter((link: string | { name: string; url: string }) => {
          if (typeof link === 'string') {
            return link && link.trim() !== '';
          } else if (typeof link === 'object' && link !== null) {
            return link.name && link.url && link.name.trim() !== '' && link.url.trim() !== '';
          }
          return false;
        })
        .map((link: string | { name: string; url: string }) => {
          if (typeof link === 'string') {
            return link; // Return old format as-is for backward compatibility
          } else {
            return link; // Return new format object
          }
        });
    }

    const response = {
      id: application.id,
      candidateName,
      email: candidateEmail,
      phone: candidatePhone,
      position: application.job.position || application.job.title,
      jobTitle: application.job.title,
      company: 'Job Portal',
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      formData: formattedFormData,
      portfolioLinks,
      resumePath: extendedApp.resumePath || null,
      resume: extendedApp.resume || null,
      candidateCity: extendedApp.candidateCity || null,
      candidateState: extendedApp.candidateState || null,
      candidateCountry: extendedApp.candidateCountry || null,
      candidateLatitude: extendedApp.candidateLatitude || null,
      candidateLongitude: extendedApp.candidateLongitude || null,
      candidateIP: extendedApp.candidateIP || null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Application detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get application with job details for email
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update the application status and auto-archive if rejected
    const updateData = {
      status: status as 'PENDING' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'SELECTED' | 'REJECTED',
      ...(status === 'REJECTED' && {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: 'system' // Could be enhanced to track actual user
      })
    }
    
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: updateData
    })

    // Extract candidate information for email
    let formData: Record<string, unknown> = {}
    try {
      formData = JSON.parse(application.formData)
    } catch (error) {
      console.error('Error parsing form data:', error)
    }

    // Get candidate name and email
    const extendedApp = application as ExtendedApplication
    const candidateName = extendedApp.candidateName || 'Candidate'
    let candidateEmail = extendedApp.candidateEmail || ''
    
    // Extract email from form data if not in application
    if (!candidateEmail) {
      for (const [, value] of Object.entries(formData)) {
        if (typeof value === 'string' && value.includes('@')) {
          candidateEmail = value
          break
        }
      }
    }

    // Create email content based on status
    let emailSubject = ''
    let emailBody = ''
    
    switch (status) {
      case 'SHORTLISTED':
        emailSubject = `Good news! You've been shortlisted for ${application.job.title}`
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Great News!</h2>
            <p>Dear ${candidateName},</p>
            <p>We are pleased to inform you that your application for the position of <strong>${application.job.title}</strong> has been shortlisted for further consideration.</p>
            
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Application Details:</h3>
              <ul style="color: #374151;">
                <li><strong>Position:</strong> ${application.job.title}</li>
                <li><strong>Application ID:</strong> ${application.id}</li>
                <li><strong>Status:</strong> Shortlisted</li>
                <li><strong>Applied Date:</strong> ${application.createdAt.toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>Our team will review your application in detail and we will contact you soon with the next steps.</p>
            <p>Thank you for your continued interest in our company.</p>
            
            <p style="margin-top: 24px;">Best regards,<br><strong>HR Team</strong></p>
          </div>
        `
        break
      case 'SELECTED':
        emailSubject = `Congratulations! Your application for ${application.job.title} has been accepted`
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Congratulations! 🎉</h2>
            <p>Dear ${candidateName},</p>
            <p>We are delighted to inform you that your application for the position of <strong>${application.job.title}</strong> has been accepted.</p>
            
            <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #1f2937;">Application Details:</h3>
              <ul style="color: #374151;">
                <li><strong>Position:</strong> ${application.job.title}</li>
                <li><strong>Application ID:</strong> ${application.id}</li>
                <li><strong>Status:</strong> Selected</li>
                <li><strong>Applied Date:</strong> ${application.createdAt.toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>We will contact you soon with the next steps including onboarding details.</p>
            <p>Welcome to the team!</p>
            
            <p style="margin-top: 24px;">Best regards,<br><strong>HR Team</strong></p>
          </div>
        `
        break
      case 'REJECTED':
        emailSubject = `Update on your application for ${application.job.title}`
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Application Update</h2>
            <p>Dear ${candidateName},</p>
            <p>Thank you for your interest in the position of <strong>${application.job.title}</strong>.</p>
            <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.</p>
            
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Application Details:</h3>
              <ul style="color: #374151;">
                <li><strong>Position:</strong> ${application.job.title}</li>
                <li><strong>Application ID:</strong> ${application.id}</li>
                <li><strong>Applied Date:</strong> ${application.createdAt.toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>We encourage you to apply for future opportunities that match your skills and experience.</p>
            <p>Thank you for considering us as a potential employer.</p>
            
            <p style="margin-top: 24px;">Best regards,<br><strong>HR Team</strong></p>
          </div>
        `
        break
      case 'UNDER_REVIEW':
        emailSubject = `Your application for ${application.job.title} is under review`
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Application Under Review</h2>
            <p>Dear ${candidateName},</p>
            <p>We have received your application for the position of <strong>${application.job.title}</strong> and it is currently under review.</p>
            
            <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6;">
              <h3 style="margin-top: 0; color: #1f2937;">Application Details:</h3>
              <ul style="color: #374151;">
                <li><strong>Position:</strong> ${application.job.title}</li>
                <li><strong>Application ID:</strong> ${application.id}</li>
                <li><strong>Status:</strong> Under Review</li>
                <li><strong>Applied Date:</strong> ${application.createdAt.toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>We will notify you of any updates regarding your application status.</p>
            <p>Thank you for your patience.</p>
            
            <p style="margin-top: 24px;">Best regards,<br><strong>HR Team</strong></p>
          </div>
        `
        break
    }

    // Send email notification if we have content and email address
    let emailSent = false
    if (candidateEmail && emailSubject && emailBody) {
      try {
        console.log(`Sending status update email to: ${candidateEmail} for status: ${status}`)
        emailSent = await emailService.sendEmail({
          to: candidateEmail,
          subject: emailSubject,
          html: emailBody,
          applicationId: application.id,
          userId: undefined
        })
        console.log(`Email sending result: ${emailSent ? 'Success' : 'Failed'}`)
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        if (emailError instanceof Error) {
          console.error('Error details:', {
            message: emailError.message,
            stack: emailError.stack
          })
        }
        // Don't fail the status update if email fails
        emailSent = false
      }
    } else {
      console.log('No email sent - missing email address or content for status:', status)
      console.log('Debug info:', { candidateEmail, hasSubject: !!emailSubject, hasBody: !!emailBody })
    }

    return NextResponse.json({ 
      id: updatedApplication.id,
      status: updatedApplication.status,
      message: 'Status updated successfully',
      emailSent: emailSent,
      candidateEmail: candidateEmail ? candidateEmail : 'Not found'
    })
  } catch (error) {
    console.error('Application status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check for authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Import verifyToken here to avoid middleware issues
    const { verifyToken } = await import('@/lib/auth')
    const decoded = verifyToken(token)
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user with role to check permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is Administrator
    if (user.role?.name !== 'Administrator') {
      return NextResponse.json({ error: 'Only administrators can delete applications' }, { status: 403 })
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true, candidateName: true }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Delete the application
    await prisma.application.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Application deleted successfully',
      deletedApplication: {
        id: application.id,
        candidateName: application.candidateName
      }
    })
  } catch (error) {
    console.error('Application deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
