import nodemailer from 'nodemailer'
import { prisma } from './prisma'

interface EmailData {
  to: string
  subject: string
  html: string
  templateId?: string
  applicationId?: string
  userId?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter
    }

    // Get SMTP settings from database first, then fallback to environment
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: [
            // Snake case (old format)
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_email', 'smtp_secure', 'from_name',
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

    // Priority: camelCase (current) > snake_case (legacy) > environment
    const host = settingsMap.emailHost || settingsMap.smtp_host || process.env.SMTP_HOST
    const port = settingsMap.emailPort || settingsMap.smtp_port || process.env.SMTP_PORT
    const user = settingsMap.emailUser || settingsMap.smtp_user || process.env.SMTP_USER
    const pass = settingsMap.emailPassword || settingsMap.smtp_pass || process.env.SMTP_PASS
    const secure = (settingsMap.emailSecure || settingsMap.smtp_secure || process.env.SMTP_SECURE) === 'true'

    console.log('EmailService using settings:', {
      host,
      port,
      user: user ? 'SET' : 'NOT SET',
      pass: pass ? 'SET' : 'NOT SET',
      secure,
      source: settingsMap.emailHost ? 'database' : 'environment'
    })

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(port || '587'),
      secure,
      auth: {
        user,
        pass,
      },
    })

    return this.transporter
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      const transporter = await this.getTransporter()
      
      // Get from email and from name from database settings or fallback to environment
      const settings = await prisma.settings.findMany({
        where: {
          key: { in: ['emailFrom', 'from_email', 'emailFromName', 'from_name'] }
        }
      })
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {} as Record<string, string>)
      
      const fromEmail = settingsMap.emailFrom || settingsMap.from_email || process.env.FROM_EMAIL
      const fromName = settingsMap.emailFromName || settingsMap.from_name || process.env.FROM_NAME
      
      // Format the from field with name if available
      const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail

      const info = await transporter.sendMail({
        from,
        to: data.to,
        subject: data.subject,
        html: data.html,
      })

      // Log email to database
      await prisma.emailLog.create({
        data: {
          to: data.to,
          subject: data.subject,
          body: data.html,
          status: 'sent',
          templateId: data.templateId,
          applicationId: data.applicationId,
          userId: data.userId,
        },
      })

      return !!info.messageId
    } catch (error) {
      console.error('Email sending failed:', error)
      
      // Log failed email
      await prisma.emailLog.create({
        data: {
          to: data.to,
          subject: data.subject,
          body: data.html,
          status: 'failed',
          templateId: data.templateId,
          applicationId: data.applicationId,
          userId: data.userId,
        },
      })
      
      return false
    }
  }

  async sendTemplateEmail(
    templateType: string,
    to: string,
    variables: Record<string, string>,
    applicationId?: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const template = await prisma.emailTemplate.findFirst({
        where: { 
          type: templateType as 'APPLICATION_STATUS' | 'APPLICATION_RECEIVED' | 'ADMIN_NOTIFICATION' | 'INTERVIEW_SCHEDULED' | 'WELCOME', 
          isActive: true 
        },
      })

      if (!template) {
        console.error(`Template not found: ${templateType}`)
        return false
      }

      let subject = template.subject
      let body = template.body

      // Replace variables in subject and body
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        subject = subject.replace(new RegExp(placeholder, 'g'), value)
        body = body.replace(new RegExp(placeholder, 'g'), value)
      })

      return await this.sendEmail({
        to,
        subject,
        html: body,
        templateId: template.id,
        applicationId,
        userId,
      })
    } catch (error) {
      console.error('Template email sending failed:', error)
      return false
    }
  }
}

export const emailService = new EmailService()
