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
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
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
