const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding complete database...\n')

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@jobportal.com' }
  })

  if (!admin) {
    console.log('❌ Admin user not found. Please run seed-roles.js first.')
    return
  }

  // Create default application form
  console.log('📝 Creating default application form...')
  const defaultForm = await prisma.form.upsert({
    where: { id: 'default-form' },
    update: {},
    create: {
      id: 'default-form',
      name: 'Standard Job Application Form',
      description: 'Default application form for job postings',
      isDefault: true
    }
  })

  // Create form fields
  const formFields = [
    {
      fieldName: 'fullName',
      fieldType: 'TEXT',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      isRequired: true,
      order: 1,
      fieldWidth: '100%'
    },
    {
      fieldName: 'email',
      fieldType: 'EMAIL',
      label: 'Email Address',
      placeholder: 'your.email@example.com',
      isRequired: true,
      order: 2,
      fieldWidth: '50%'
    },
    {
      fieldName: 'phone',
      fieldType: 'PHONE',
      label: 'Phone Number',
      placeholder: '+1 (555) 000-0000',
      isRequired: true,
      order: 3,
      fieldWidth: '50%'
    },
    {
      fieldName: 'resume',
      fieldType: 'FILE',
      label: 'Resume/CV',
      placeholder: 'Upload your resume (PDF, DOC, DOCX)',
      isRequired: true,
      order: 4,
      fieldWidth: '100%'
    },
    {
      fieldName: 'coverLetter',
      fieldType: 'TEXTAREA',
      label: 'Cover Letter',
      placeholder: 'Tell us why you are interested in this position...',
      isRequired: false,
      order: 5,
      fieldWidth: '100%'
    },
    {
      fieldName: 'experience',
      fieldType: 'NUMBER',
      label: 'Years of Experience',
      placeholder: '0',
      isRequired: false,
      order: 6,
      fieldWidth: '50%'
    },
    {
      fieldName: 'currentLocation',
      fieldType: 'TEXT',
      label: 'Current Location',
      placeholder: 'City, Country',
      isRequired: false,
      order: 7,
      fieldWidth: '50%'
    }
  ]

  for (const field of formFields) {
    const existing = await prisma.formField.findFirst({
      where: {
        formId: defaultForm.id,
        fieldName: field.fieldName
      }
    })

    if (!existing) {
      await prisma.formField.create({
        data: {
          ...field,
          formId: defaultForm.id
        }
      })
    }
  }

  console.log('✅ Created default form with 7 fields\n')

  // Create sample jobs
  console.log('💼 Creating sample jobs...')
  const jobs = [
    {
      title: 'Senior React Developer',
      position: 'Senior Level',
      description: '<h2>About the Role</h2><p>We are seeking an experienced React Developer to join our growing team. You will be responsible for building scalable web applications using React, TypeScript, and modern web technologies.</p><h3>Key Responsibilities:</h3><ul><li>Develop and maintain web applications</li><li>Collaborate with designers and backend developers</li><li>Write clean, maintainable code</li><li>Participate in code reviews</li></ul>',
      department: 'Development',
      location: 'Remote',
      salary: '$80,000 - $120,000',
      requirements: '<h3>Requirements:</h3><ul><li>5+ years of React experience</li><li>Strong TypeScript skills</li><li>Experience with Next.js</li><li>Good communication skills</li></ul>',
      experienceLevel: 'Senior Level',
      status: 'ACTIVE',
      formId: defaultForm.id
    },
    {
      title: 'Graphic Designer',
      position: 'Mid Level',
      description: '<h2>About the Role</h2><p>We are looking for a creative graphic designer to join our marketing team. You will create stunning visual content for digital and print media.</p><h3>Key Responsibilities:</h3><ul><li>Design marketing materials</li><li>Create brand assets</li><li>Collaborate with marketing team</li><li>Maintain design consistency</li></ul>',
      department: 'Design',
      location: 'Faridabad, India',
      salary: '₹50,000 - ₹80,000',
      requirements: '<h3>Requirements:</h3><ul><li>3+ years of graphic design experience</li><li>Proficient in Adobe Creative Suite</li><li>Strong portfolio</li><li>Creative thinking</li></ul>',
      experienceLevel: 'Mid Level',
      status: 'ACTIVE',
      formId: defaultForm.id
    },
    {
      title: 'Digital Marketing Manager',
      position: 'Managerial Level',
      description: '<h2>About the Role</h2><p>Lead our digital marketing efforts and drive online growth. You will develop and execute comprehensive digital marketing strategies.</p><h3>Key Responsibilities:</h3><ul><li>Develop marketing strategies</li><li>Manage social media campaigns</li><li>Analyze marketing metrics</li><li>Lead marketing team</li></ul>',
      department: 'Marketing',
      location: 'Delhi, India',
      salary: '₹80,000 - ₹120,000',
      requirements: '<h3>Requirements:</h3><ul><li>5+ years of digital marketing experience</li><li>Team leadership experience</li><li>Strong analytical skills</li><li>ROI-focused mindset</li></ul>',
      experienceLevel: 'Managerial Level',
      status: 'ACTIVE',
      formId: defaultForm.id
    },
    {
      title: 'WordPress Developer',
      position: 'Junior Level',
      description: '<h2>About the Role</h2><p>Join our web development team as a WordPress Developer. You will build and maintain WordPress websites for our clients.</p><h3>Key Responsibilities:</h3><ul><li>Build WordPress websites</li><li>Customize themes and plugins</li><li>Ensure website performance</li><li>Provide technical support</li></ul>',
      department: 'Development',
      location: 'Remote',
      salary: '$40,000 - $60,000',
      requirements: '<h3>Requirements:</h3><ul><li>2+ years of WordPress experience</li><li>Knowledge of PHP, HTML, CSS</li><li>Plugin development experience</li><li>Problem-solving skills</li></ul>',
      experienceLevel: 'Junior Level',
      status: 'ACTIVE',
      formId: defaultForm.id
    },
    {
      title: 'HR Manager',
      position: 'Managerial Level',
      description: '<h2>About the Role</h2><p>Lead our human resources department and manage all HR functions. You will be responsible for recruitment, employee relations, and HR policies.</p><h3>Key Responsibilities:</h3><ul><li>Manage recruitment process</li><li>Handle employee relations</li><li>Develop HR policies</li><li>Performance management</li></ul>',
      department: 'HR',
      location: 'Faridabad, India',
      salary: '₹60,000 - ₹90,000',
      requirements: '<h3>Requirements:</h3><ul><li>5+ years of HR experience</li><li>Strong interpersonal skills</li><li>Knowledge of labor laws</li><li>Leadership abilities</li></ul>',
      experienceLevel: 'Managerial Level',
      status: 'ACTIVE',
      formId: defaultForm.id
    }
  ]

  for (const jobData of jobs) {
    const existing = await prisma.job.findFirst({
      where: { title: jobData.title }
    })

    if (!existing) {
      await prisma.job.create({
        data: {
          ...jobData,
          creatorId: admin.id
        }
      })
    }
  }

  console.log(`✅ Created ${jobs.length} sample jobs\n`)

  // Create email templates
  console.log('📧 Creating email templates...')
  const templates = [
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
      isActive: true
    },
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
      isActive: true
    },
    {
      name: 'Admin Notification',
      type: 'ADMIN_NOTIFICATION',
      subject: 'New Job Application - {{job_title}}',
      body: `
        <h2>New Job Application</h2>
        <p>A new application has been submitted for the position of <strong>{{job_title}}</strong>.</p>
        <p><strong>Applicant:</strong> {{applicant_name}}</p>
        <p><strong>Email:</strong> {{applicant_email}}</p>
        <p><strong>Applied on:</strong> {{apply_date}}</p>
        <p>Please review the application in your admin dashboard.</p>
        <p>Job Portal System</p>
      `,
      variables: JSON.stringify(['job_title', 'applicant_name', 'applicant_email', 'apply_date']),
      isActive: true
    }
  ]

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template
    })
  }

  console.log('✅ Created 3 email templates\n')

  // Create settings
  console.log('⚙️ Creating system settings...')
  const settings = [
    { key: 'company_name', value: 'Job Portal', type: 'text' },
    { key: 'smtp_host', value: '', type: 'text' },
    { key: 'smtp_port', value: '587', type: 'number' },
    { key: 'smtp_user', value: '', type: 'text' },
    { key: 'smtp_pass', value: '', type: 'text' },
    { key: 'from_email', value: 'noreply@jobportal.com', type: 'text' },
    { key: 'max_file_size', value: '5242880', type: 'number' },
    { key: 'allowed_file_types', value: 'pdf,doc,docx', type: 'text' }
  ]

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    })
  }

  console.log('✅ Created system settings\n')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log('- 1 default application form created')
  console.log('- 7 form fields created')
  console.log('- 5 sample jobs created')
  console.log('- 3 email templates created')
  console.log('- 8 system settings created')
  console.log('\n🔐 Login credentials:')
  console.log('Email: admin@jobportal.com')
  console.log('Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
