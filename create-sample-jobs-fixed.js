const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleJobs() {
  try {
    // First, let's get the admin user to assign jobs to
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('No admin user found. Creating one...');
      const admin = await prisma.user.create({
        data: {
          email: 'admin@jobportal.com',
          password: '$2a$12$dummy_password_hash', // This should be hashed in real app
          role: 'ADMIN',
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      console.log('Admin user created:', admin.email);
    }

    // Get the forms we created
    const juniorForm = await prisma.form.findFirst({
      where: { name: 'Junior Developer Assessment' }
    });

    const seniorForm = await prisma.form.findFirst({
      where: { name: 'Senior Developer & Team Lead Assessment' }
    });

    if (!juniorForm || !seniorForm) {
      console.log('Assessment forms not found. Please create them first.');
      return;
    }

    // Create Junior Developer Job
    const juniorJob = await prisma.job.create({
      data: {
        title: "Junior Software Developer",
        description: `
          <h2>About the Role</h2>
          <p>We're looking for a passionate Junior Software Developer to join our growing team. This is an excellent opportunity for someone who is eager to learn and grow in a supportive environment.</p>
          
          <h3>What You'll Do:</h3>
          <ul>
            <li>Develop and maintain web applications using modern technologies</li>
            <li>Collaborate with senior developers on various projects</li>
            <li>Write clean, maintainable code following best practices</li>
            <li>Participate in code reviews and team meetings</li>
            <li>Learn new technologies and frameworks as needed</li>
          </ul>
          
          <h3>What We Offer:</h3>
          <ul>
            <li>Mentorship from experienced developers</li>
            <li>Flexible working arrangements</li>
            <li>Professional development opportunities</li>
            <li>Competitive salary and benefits</li>
            <li>Modern tech stack and tools</li>
          </ul>
        `,
        position: "Junior Software Developer",
        department: "Engineering",
        location: "San Francisco, CA / Remote",
        salary: "$45,000 - $65,000",
        requirements: `
          - Bachelor's degree in Computer Science or related field (or equivalent experience)
          - Basic understanding of JavaScript, HTML, and CSS
          - Familiarity with at least one modern framework (React, Vue, Angular)
          - Understanding of version control (Git)
          - Strong problem-solving skills
          - Excellent communication skills
          - Eagerness to learn and grow
        `,
        experienceLevel: "ENTRY_LEVEL",
        status: "ACTIVE",
        isExternal: true,
        creatorId: adminUser?.id || 1,
        assigneeId: adminUser?.id || 1,
        formId: juniorForm.id
      }
    });

    console.log('Junior Developer job created:', juniorJob.title);

    // Create Senior Developer Job
    const seniorJob = await prisma.job.create({
      data: {
        title: "Senior Software Engineer",
        description: `
          <h2>Lead Our Engineering Excellence</h2>
          <p>We're seeking an experienced Senior Software Engineer to lead technical initiatives and mentor our development team. This role offers the opportunity to shape our technical direction and drive innovation.</p>
          
          <h3>Key Responsibilities:</h3>
          <ul>
            <li>Design and architect scalable software solutions</li>
            <li>Lead complex technical projects from conception to delivery</li>
            <li>Mentor junior and mid-level developers</li>
            <li>Conduct technical interviews and code reviews</li>
            <li>Collaborate with product managers and stakeholders</li>
            <li>Establish and maintain coding standards and best practices</li>
            <li>Drive technical decision-making and innovation</li>
          </ul>
          
          <h3>What We Provide:</h3>
          <ul>
            <li>Technical leadership opportunities</li>
            <li>Cutting-edge technology stack</li>
            <li>Flexible remote work options</li>
            <li>Competitive compensation package</li>
            <li>Stock options and bonus potential</li>
            <li>Conference and learning budget</li>
          </ul>
        `,
        position: "Senior Software Engineer",
        department: "Engineering",
        location: "New York, NY / Remote",
        salary: "$80,000 - $120,000",
        requirements: `
          - 5+ years of professional software development experience
          - Expert-level knowledge of JavaScript/TypeScript and modern frameworks
          - Experience with cloud platforms (AWS, Azure, GCP)
          - Strong understanding of software architecture and design patterns
          - Experience with microservices and distributed systems
          - Leadership and mentoring experience
          - Excellent problem-solving and analytical skills
          - Strong communication and collaboration skills
          - Experience with CI/CD and DevOps practices
        `,
        experienceLevel: "SENIOR",
        status: "ACTIVE",
        isExternal: true,
        creatorId: adminUser?.id || 1,
        assigneeId: adminUser?.id || 1,
        formId: seniorForm.id
      }
    });

    console.log('Senior Developer job created:', seniorJob.title);

    // Update embed codes for external access
    await prisma.job.update({
      where: { id: juniorJob.id },
      data: { embedCode: `embed_junior_${juniorJob.id}` }
    });

    await prisma.job.update({
      where: { id: seniorJob.id },
      data: { embedCode: `embed_senior_${seniorJob.id}` }
    });

    console.log('\n✅ Sample jobs created successfully!');
    console.log('\nJob Details:');
    console.log(`Junior Developer Job ID: ${juniorJob.id}`);
    console.log(`Junior Form ID: ${juniorForm.id}`);
    console.log(`Senior Developer Job ID: ${seniorJob.id}`);
    console.log(`Senior Form ID: ${seniorForm.id}`);
    
    console.log('\n🔗 External Application URLs:');
    console.log(`Junior: http://localhost:3000/embed/job/${juniorJob.id}`);
    console.log(`Senior: http://localhost:3000/embed/job/${seniorJob.id}`);

  } catch (error) {
    console.error('Error creating sample jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleJobs();
