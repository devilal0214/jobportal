import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

interface SMTPSettings {
  host: string
  port: number
  user: string
  pass: string
  fromEmail: string
  fromName?: string
  secure?: boolean
}

async function getSMTPSettings(): Promise<SMTPSettings | null> {
  try {
    // Try to get SMTP settings from database first
    // Check both snake_case (old format) and camelCase (current format) keys
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: [
            // Snake case (old format)
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_email', 'smtp_secure',
            // Camel case (current format)
            'emailHost', 'emailPort', 'emailUser', 'emailPassword', 'emailFrom', 'emailFromName'
          ]
        }
      }
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    console.log('Available settings keys:', Object.keys(settingsMap))

    // Priority order: camelCase (current) > snake_case (legacy) > environment
    const host = settingsMap.emailHost || settingsMap.smtp_host
    const port = settingsMap.emailPort || settingsMap.smtp_port
    const user = settingsMap.emailUser || settingsMap.smtp_user
    const pass = settingsMap.emailPassword || settingsMap.smtp_pass
    const fromEmail = settingsMap.emailFrom || settingsMap.from_email
    const fromName = settingsMap.emailFromName || settingsMap.from_name
    const secure = (settingsMap.emailSecure || settingsMap.smtp_secure) === 'true'

    // If we have database settings with the required fields, use them
    if (host && user) {
      console.log('Using database settings:', { host, port, user: user ? 'SET' : 'EMPTY', fromEmail, fromName })
      return {
        host,
        port: parseInt(port || '587'),
        user,
        pass: pass || '',
        fromEmail: fromEmail || user,
        fromName,
        secure
      }
    }

    console.log('Database settings incomplete, falling back to environment variables')

    // Fallback to environment variables
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || '',
        fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER,
        fromName: process.env.FROM_NAME,
        secure: process.env.SMTP_SECURE === 'true'
      }
    }

    return null
  } catch (error) {
    console.error('Error getting SMTP settings:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, message } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      )
    }

    // Get SMTP settings
    const smtpSettings = await getSMTPSettings()

    if (!smtpSettings) {
      return NextResponse.json({
        success: false,
        message: 'SMTP settings not configured. Please configure SMTP in admin settings or environment variables.',
        details: 'No SMTP configuration found in database or environment variables'
      }, { status: 400 })
    }

    // Create transporter with database settings
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure || false,
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.pass,
      },
    })

    // Verify SMTP connection
    try {
      await transporter.verify()
    } catch (verifyError) {
      return NextResponse.json({
        success: false,
        message: 'SMTP connection failed. Please check your SMTP settings.',
        details: {
          error: verifyError instanceof Error ? verifyError.message : 'Connection verification failed',
          settings: {
            host: smtpSettings.host,
            port: smtpSettings.port,
            user: smtpSettings.user,
            secure: smtpSettings.secure
          }
        }
      }, { status: 400 })
    }

    // Create test email content
    const subject = '[TEST] SMTP Configuration Test'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin: 0;">🧪 SMTP Test Email</h2>
          <p style="color: #6b7280; margin: 10px 0 0 0;">This is a test email to verify your SMTP configuration.</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #1f2937; margin-top: 0;">Test Details</h3>
          <ul style="color: #374151; line-height: 1.6;">
            <li><strong>Sent to:</strong> ${email}</li>
            <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>SMTP Host:</strong> ${smtpSettings.host}</li>
            <li><strong>SMTP Port:</strong> ${smtpSettings.port}</li>
            <li><strong>From Email:</strong> ${smtpSettings.fromEmail}</li>
          </ul>
          
          ${message ? `
            <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <h4 style="color: #1f2937; margin: 0 0 10px 0;">Custom Message:</h4>
              <p style="color: #374151; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 20px; padding: 15px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 4px;">
            <p style="color: #065f46; margin: 0;">
              ✅ <strong>Success!</strong> If you're reading this email, your SMTP configuration is working correctly.
            </p>
          </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>This email was sent from the Job Portal SMTP Test feature.</p>
        </div>
      </div>
    `

    // Send the test email
    const fromName = smtpSettings.fromName || "Job Portal Test"
    const from = `"${fromName}" <${smtpSettings.fromEmail}>`
    
    const info = await transporter.sendMail({
      from: from,
      to: email,
      subject: subject,
      html: html,
    })

    // Log the email attempt
    try {
      await prisma.emailLog.create({
        data: {
          to: email,
          subject: subject,
          body: html,
          status: 'sent',
          templateId: 'smtp-test',
        },
      })
    } catch (logError) {
      console.warn('Failed to log email:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      details: {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        settings: {
          host: smtpSettings.host,
          port: smtpSettings.port,
          fromEmail: smtpSettings.fromEmail
        }
      }
    })

  } catch (error) {
    console.error('SMTP test error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send test email',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        type: error instanceof Error ? error.constructor.name : 'UnknownError'
      }
    }, { status: 500 })
  }
}
