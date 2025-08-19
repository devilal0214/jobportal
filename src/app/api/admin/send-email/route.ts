import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { EmailService } from '@/lib/email'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DecodedToken {
  userId: string
  role: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let decoded: DecodedToken
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user exists and has admin/HR role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    })

    if (!user || !user.role || (user.role.name !== 'Administrator' && user.role.name !== 'HR')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const { recipients, subject, content } = await request.json()

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients are required' }, { status: 400 })
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return NextResponse.json({ 
        error: `Invalid email addresses: ${invalidEmails.join(', ')}` 
      }, { status: 400 })
    }

    // Initialize email service
    const emailService = new EmailService()

    // Send emails to all recipients
    const results = []
    const errors = []

    for (const email of recipients) {
      try {
        // Simple variable replacement (can be expanded)
        const personalizedContent = content.replace(/\{\{name\}\}/g, email.split('@')[0])
        
        const success = await emailService.sendEmail({
          to: email,
          subject: subject,
          html: personalizedContent
        })
        
        if (!success) {
          throw new Error('Email service returned false')
        }
        
        results.push({ email, status: 'sent' })

      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error)
        errors.push({ email, error: 'Failed to send' })
        results.push({ email, status: 'failed' })
      }
    }

    // Return results
    const successCount = results.filter(r => r.status === 'sent').length
    const failCount = results.filter(r => r.status === 'failed').length

    if (successCount === 0) {
      return NextResponse.json({ 
        error: 'Failed to send any emails',
        details: errors
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${successCount} of ${recipients.length} emails`,
      results: {
        sent: successCount,
        failed: failCount,
        details: results
      }
    })

  } catch (error) {
    console.error('Email send API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
