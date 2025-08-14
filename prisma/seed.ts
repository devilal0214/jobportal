import { PrismaClient, TemplateType } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jobportal.com' },
    update: {},
    create: {
      email: 'admin@jobportal.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create HR user
  const hrPassword = await hashPassword('hr123456')
  const hr = await prisma.user.upsert({
    where: { email: 'hr@jobportal.com' },
    update: {
      password: hrPassword,
    },
    create: {
      email: 'hr@jobportal.com',
      name: 'HR Manager',
      password: hrPassword,
      role: 'HR',
    },
  })

  // Create Manager user
  const managerPassword = await hashPassword('manager123')
  const manager = await prisma.user.upsert({
    where: { email: 'manager@jobportal.com' },
    update: {},
    create: {
      email: 'manager@jobportal.com',
      name: 'Department Manager',
      password: managerPassword,
      role: 'MANAGER',
    },
  })

  // Create sample jobs
  const jobs = [
    {
      title: 'Graphic Designer',
      description: 'We are looking for a creative graphic designer to join our team.',
      position: 'Graphic Designer',
      location: 'Faridabad',
      experienceLevel: '2+ years',
      creatorId: admin.id,
    },
    {
      title: 'Junior Graphic Designer',
      description: 'Entry-level position for junior graphic designer.',
      position: 'Junior Graphic Designer',
      location: 'Delhi',
      experienceLevel: '0-1 years',
      creatorId: hr.id,
    },
    {
      title: 'WordPress Developer',
      description: 'Experienced WordPress developer needed for web development projects.',
      position: 'WordPress Developer',
      location: 'Delhi',
      experienceLevel: '3+ years',
      creatorId: admin.id,
    },
  ]

  for (const jobData of jobs) {
    const existingJob = await prisma.job.findFirst({
      where: { title: jobData.title },
    })
    
    if (!existingJob) {
      await prisma.job.create({
        data: jobData,
      })
    }
  }

  // Create email templates
  const templates = [
    {
      name: 'Application Status Update',
      type: 'APPLICATION_STATUS',
      subject: 'Update on Your Job Application - {{job_title}}',
      body: `
        <h2>Application Status Update</h2>
        <p>Dear {{applicant_name}},</p>
        <p>We wanted to update you on the status of your application for the position of <strong>{{job_title}}</strong>.</p>
        <p><strong>Current Status:</strong> {{status}}</p>
        {{#if remarks}}
        <p><strong>Comments:</strong> {{remarks}}</p>
        {{/if}}
        <p>Thank you for your interest in our company.</p>
        <p>Best regards,<br>Job Portal Team</p>
      `,
      variables: JSON.stringify(['applicant_name', 'job_title', 'status', 'remarks']),
    },
    {
      name: 'Application Received',
      type: 'APPLICATION_RECEIVED',
      subject: 'Application Received - {{job_title}}',
      body: `
        <h2>Application Received</h2>
        <p>Dear {{applicant_name}},</p>
        <p>Thank you for applying for the position of <strong>{{job_title}}</strong>.</p>
        <p>We have received your application and our team will review it shortly.</p>
        <p>You will hear from us within the next few business days.</p>
        <p>Best regards,<br>Job Portal Team</p>
      `,
      variables: JSON.stringify(['applicant_name', 'job_title']),
    },
    {
      name: 'Admin Notification',
      type: 'ADMIN_NOTIFICATION',
      subject: 'New Job Application - {{job_title}}',
      body: `
        <h2>New Job Application</h2>
        <p>A new application has been submitted for the position of <strong>{{job_title}}</strong>.</p>
        <p><strong>Applicant:</strong> {{applicant_name}}</p>
        <p><strong>Applied on:</strong> {{apply_date}}</p>
        <p>Please review the application in your admin dashboard.</p>
        <p>Job Portal System</p>
      `,
      variables: JSON.stringify(['job_title', 'applicant_name', 'apply_date']),
    },
  ]

  for (const templateData of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: templateData.name },
      update: {},
      create: {
        name: templateData.name,
        type: templateData.type as 'APPLICATION_STATUS' | 'APPLICATION_RECEIVED' | 'ADMIN_NOTIFICATION',
        subject: templateData.subject,
        body: templateData.body,
        variables: templateData.variables,
      },
    })
  }

  // Create settings
  const settings = [
    { key: 'smtp_host', value: 'smtp.gmail.com', type: 'text' },
    { key: 'smtp_port', value: '587', type: 'number' },
    { key: 'smtp_user', value: '', type: 'text' },
    { key: 'smtp_pass', value: '', type: 'text' },
    { key: 'from_email', value: 'noreply@jobportal.com', type: 'text' },
    { key: 'company_name', value: 'Job Portal Inc.', type: 'text' },
    { key: 'max_file_size', value: '5242880', type: 'number' }, // 5MB
    { key: 'allowed_file_types', value: 'pdf,doc,docx', type: 'text' },
  ]

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('Database seeded successfully!')
  console.log('Admin credentials: admin@jobportal.com / admin123')
  console.log('HR credentials: hr@jobportal.com / hr123456')
  console.log('Manager credentials: manager@jobportal.com / manager123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
