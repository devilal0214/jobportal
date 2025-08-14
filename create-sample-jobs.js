import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleJob        location: "New York, NY / Remote",
        salary: "$80,000 - $120,000",
        experienceLevel: "SENIOR",
        status: "ACTIVE",
  try {
    // Get HR user to be the creator
    const hrUser = await prisma.user.findFirst({
      where: { role: 'HR' }
    })

    if (!hrUser) {
      console.error('HR user not found')
      return
    }

    // Get the forms we just created
    const juniorForm = await prisma.form.findFirst({
      where: { name: "Junior Developer Assessment" }
    })
    
    const seniorForm = await prisma.form.findFirst({
      where: { name: "Senior Developer & Team Lead Assessment" }
    })

    if (!juniorForm || !seniorForm) {
      console.error('Forms not found. Please run the form creation script first.')
      return
    }

    // Create junior developer job
    const juniorJob = await prisma.job.create({
      data: {
        title: "Junior Full Stack Developer",
        position: "Junior Full Stack Developer",
        description: `
          <h2>About the Role</h2>
          <p>We're looking for an enthusiastic Junior Full Stack Developer to join our growing team. This is an excellent opportunity for someone early in their career to work on exciting projects and grow their skills.</p>
          
          <h3>What You'll Do:</h3>
          <ul>
            <li>Develop and maintain web applications using modern JavaScript frameworks</li>
            <li>Work with senior developers to implement new features</li>
            <li>Participate in code reviews and testing</li>
            <li>Learn and apply best practices in software development</li>
            <li>Collaborate with cross-functional teams</li>
          </ul>
          
          <h3>What We're Looking For:</h3>
          <ul>
            <li>1-3 years of programming experience</li>
            <li>Knowledge of JavaScript, HTML, CSS</li>
            <li>Familiarity with React, Vue.js, or Angular</li>
            <li>Basic understanding of databases and APIs</li>
            <li>Strong problem-solving skills</li>
            <li>Eagerness to learn and grow</li>
          </ul>
          
          <h3>What We Offer:</h3>
          <ul>
            <li>Competitive salary: $45,000 - $65,000</li>
            <li>Comprehensive health benefits</li>
            <li>Professional development opportunities</li>
            <li>Mentorship from senior developers</li>
            <li>Flexible work arrangements</li>
          </ul>
        `,
        location: "San Francisco, CA / Remote",
        salary: "$45,000 - $65,000",
        experienceLevel: "ENTRY_LEVEL",
        status: "ACTIVE",
        formId: juniorForm.id,
        creatorId: hrUser.id
      }
    })

    // Create senior developer job
    const seniorJob = await prisma.job.create({
      data: {
        title: "Senior Full Stack Developer / Team Lead",
        position: "Senior Full Stack Developer / Team Lead",
        description: `
          <h2>About the Role</h2>
          <p>We're seeking an experienced Senior Full Stack Developer who can also take on team leadership responsibilities. You'll be instrumental in driving technical excellence and mentoring our development team.</p>
          
          <h3>What You'll Do:</h3>
          <ul>
            <li>Lead the development of complex, scalable web applications</li>
            <li>Mentor junior and mid-level developers</li>
            <li>Make architectural decisions and drive technical strategy</li>
            <li>Collaborate with product managers and designers</li>
            <li>Conduct code reviews and ensure quality standards</li>
            <li>Participate in system design and technical planning</li>
          </ul>
          
          <h3>What We're Looking For:</h3>
          <ul>
            <li>5+ years of full stack development experience</li>
            <li>Expert knowledge of JavaScript/TypeScript, React/Vue/Angular</li>
            <li>Strong experience with Node.js, Python, or similar backend technologies</li>
            <li>Experience with cloud platforms (AWS, GCP, Azure)</li>
            <li>Leadership and mentoring experience</li>
            <li>System design and architecture expertise</li>
            <li>Excellent communication and problem-solving skills</li>
          </ul>
          
          <h3>What We Offer:</h3>
          <ul>
            <li>Competitive salary: $90,000 - $130,000</li>
            <li>Equity package</li>
            <li>Comprehensive health benefits</li>
            <li>Leadership development opportunities</li>
            <li>Conference and training budget</li>
            <li>Flexible work arrangements</li>
          </ul>
        `,
        location: "New York, NY / Remote",
        salary: "$90,000 - $130,000",
        jobType: "FULL_TIME",
        experience: "SENIOR_LEVEL",
        status: "ACTIVE",
        formId: seniorForm.id,
        creatorId: hrUser.id
      }
    })

    console.log('✅ Sample jobs created successfully!')
    console.log(`💼 Junior Developer Job ID: ${juniorJob.id}`)
    console.log(`💼 Senior Developer Job ID: ${seniorJob.id}`)

    console.log('\n🎯 Assessment forms and jobs are ready for testing!')
    console.log('📋 Junior Developer Assessment: Focuses on basic programming concepts, problem-solving, and learning attitude')
    console.log('📋 Senior Developer Assessment: Tests advanced architecture, leadership, and strategic thinking skills')
    console.log('\n🌐 You can now test the forms by applying to these jobs!')

  } catch (error) {
    console.error('Error creating sample jobs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleJobs()
