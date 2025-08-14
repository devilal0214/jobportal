import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleForms() {
  try {
    // Form 1: Junior Developer Assessment Form
    const juniorForm = await prisma.form.create({
      data: {
        name: "Junior Developer Assessment",
        description: "Comprehensive assessment for entry-level developer positions",
        isDefault: false,
        fields: {
          create: [
            // Basic Information
            {
              fieldName: "fullName",
              fieldType: "TEXT",
              label: "Full Name",
              placeholder: "Enter your full name",
              isRequired: true,
              order: 1,
              fieldWidth: "50%"
            },
            {
              fieldName: "email",
              fieldType: "EMAIL",
              label: "Email Address",
              placeholder: "your.email@example.com",
              isRequired: true,
              order: 2,
              fieldWidth: "50%"
            },
            {
              fieldName: "phone",
              fieldType: "TEL",
              label: "Phone Number",
              placeholder: "+1 (555) 123-4567",
              isRequired: true,
              order: 3,
              fieldWidth: "50%"
            },
            {
              fieldName: "experience",
              fieldType: "SELECT",
              label: "Years of Programming Experience",
              options: JSON.stringify(["Less than 1 year", "1-2 years", "2-3 years", "3+ years"]),
              isRequired: true,
              order: 4,
              fieldWidth: "50%"
            },
            
            // Technical Skills Assessment
            {
              fieldName: "technicalSkills",
              fieldType: "SKILLS",
              label: "Technical Skills Rating",
              placeholder: "Rate your proficiency in each technology",
              isRequired: true,
              order: 5,
              fieldWidth: "100%"
            },
            
            // Programming Questions
            {
              fieldName: "favoriteProgrammingLanguage",
              fieldType: "SELECT",
              label: "What is your favorite programming language?",
              options: JSON.stringify(["JavaScript", "Python", "Java", "C#", "C++", "React", "Angular", "Vue.js", "Other"]),
              isRequired: true,
              order: 6,
              fieldWidth: "50%"
            },
            {
              fieldName: "codingPractice",
              fieldType: "TEXTAREA",
              label: "Describe your approach to solving a coding problem. Walk us through your thought process.",
              placeholder: "Explain how you break down problems, research solutions, and implement code...",
              isRequired: true,
              order: 7,
              fieldWidth: "100%"
            },
            {
              fieldName: "debuggingScenario",
              fieldType: "TEXTAREA",
              label: "You encounter a bug where a user login feature stops working after a recent update. Describe your debugging approach.",
              placeholder: "Explain your systematic approach to identifying and fixing the issue...",
              isRequired: true,
              order: 8,
              fieldWidth: "100%"
            },
            
            // Problem Solving & Logical Thinking
            {
              fieldName: "algorithmProblem",
              fieldType: "TEXTAREA",
              label: "Algorithm Challenge: How would you find the largest number in an array of integers? Explain your approach and consider efficiency.",
              placeholder: "Describe your algorithm, time complexity, and any optimizations...",
              isRequired: true,
              order: 9,
              fieldWidth: "100%"
            },
            {
              fieldName: "projectChallenge",
              fieldType: "TEXTAREA",
              label: "Describe a challenging project you worked on. What obstacles did you face and how did you overcome them?",
              placeholder: "Detail the project, challenges faced, solutions implemented, and lessons learned...",
              isRequired: true,
              order: 10,
              fieldWidth: "100%"
            },
            
            // Learning & Growth
            {
              fieldName: "learningApproach",
              fieldType: "RADIO",
              label: "How do you prefer to learn new programming concepts?",
              options: JSON.stringify([
                "Reading documentation and tutorials",
                "Watching video courses",
                "Hands-on coding and experimentation",
                "Pair programming with experienced developers",
                "Online courses and certifications"
              ]),
              isRequired: true,
              order: 11,
              fieldWidth: "100%"
            },
            {
              fieldName: "futureGoals",
              fieldType: "TEXTAREA",
              label: "What are your career goals for the next 2-3 years in software development?",
              placeholder: "Describe your professional aspirations, skills you want to develop, areas of interest...",
              isRequired: true,
              order: 12,
              fieldWidth: "100%"
            },
            
            // Portfolio and Experience
            {
              fieldName: "portfolioLinks",
              fieldType: "TAGS",
              label: "Portfolio Links (GitHub, personal website, etc.)",
              placeholder: "https://github.com/yourusername",
              isRequired: false,
              order: 13,
              fieldWidth: "100%"
            },
            {
              fieldName: "resumeUpload",
              fieldType: "FILE",
              label: "Upload Resume/CV",
              placeholder: "Upload your resume in PDF format",
              isRequired: true,
              order: 14,
              fieldWidth: "50%"
            }
          ]
        }
      }
    })

    // Form 2: Senior Developer & Team Lead Assessment
    const seniorForm = await prisma.form.create({
      data: {
        name: "Senior Developer & Team Lead Assessment",
        description: "Advanced assessment for senior developer and team leadership positions",
        isDefault: false,
        fields: {
          create: [
            // Basic Information
            {
              fieldName: "fullName",
              fieldType: "TEXT",
              label: "Full Name",
              placeholder: "Enter your full name",
              isRequired: true,
              order: 1,
              fieldWidth: "50%"
            },
            {
              fieldName: "email",
              fieldType: "EMAIL",
              label: "Email Address",
              placeholder: "your.email@example.com",
              isRequired: true,
              order: 2,
              fieldWidth: "50%"
            },
            {
              fieldName: "phone",
              fieldType: "TEL",
              label: "Phone Number",
              placeholder: "+1 (555) 123-4567",
              isRequired: true,
              order: 3,
              fieldWidth: "50%"
            },
            {
              fieldName: "experience",
              fieldType: "SELECT",
              label: "Years of Professional Development Experience",
              options: JSON.stringify(["5-7 years", "7-10 years", "10-15 years", "15+ years"]),
              isRequired: true,
              order: 4,
              fieldWidth: "50%"
            },
            
            // Advanced Technical Skills
            {
              fieldName: "technicalSkills",
              fieldType: "SKILLS",
              label: "Advanced Technical Skills Rating",
              placeholder: "Rate your expertise in each technology/area",
              isRequired: true,
              order: 5,
              fieldWidth: "100%"
            },
            
            // Architecture & Design
            {
              fieldName: "systemDesign",
              fieldType: "TEXTAREA",
              label: "System Design Challenge: Design a scalable real-time chat application that can handle 100k concurrent users. Describe your architecture, technology choices, and scaling strategies.",
              placeholder: "Detail your architecture, database design, caching strategies, load balancing, microservices, etc...",
              isRequired: true,
              order: 6,
              fieldWidth: "100%"
            },
            {
              fieldName: "designPatterns",
              fieldType: "TEXTAREA",
              label: "Explain a complex design pattern you've implemented in a real project. Why did you choose it and what problems did it solve?",
              placeholder: "Describe the pattern, implementation context, benefits, and trade-offs...",
              isRequired: true,
              order: 7,
              fieldWidth: "100%"
            },
            
            // Leadership & Management
            {
              fieldName: "teamLeadership",
              fieldType: "TEXTAREA",
              label: "Describe your experience leading a development team. How do you handle code reviews, mentoring junior developers, and ensuring code quality?",
              placeholder: "Detail your leadership approach, team management strategies, mentoring philosophy...",
              isRequired: true,
              order: 8,
              fieldWidth: "100%"
            },
            {
              fieldName: "conflictResolution",
              fieldType: "TEXTAREA",
              label: "Scenario: Two senior developers on your team have fundamentally different approaches to implementing a critical feature, causing delays. How do you resolve this?",
              placeholder: "Describe your conflict resolution strategy, decision-making process, and communication approach...",
              isRequired: true,
              order: 9,
              fieldWidth: "100%"
            },
            
            // Technical Decision Making
            {
              fieldName: "technologySelection",
              fieldType: "TEXTAREA",
              label: "Describe a situation where you had to choose between multiple technology stacks for a project. What factors did you consider and how did you make the decision?",
              placeholder: "Explain your evaluation criteria, trade-offs considered, stakeholder involvement, and outcome...",
              isRequired: true,
              order: 10,
              fieldWidth: "100%"
            },
            {
              fieldName: "technicalDebt",
              fieldType: "TEXTAREA",
              label: "How do you balance feature development with technical debt management? Provide a specific example from your experience.",
              placeholder: "Describe your approach to identifying, prioritizing, and addressing technical debt...",
              isRequired: true,
              order: 11,
              fieldWidth: "100%"
            },
            
            // Strategic Thinking
            {
              fieldName: "innovation",
              fieldType: "TEXTAREA",
              label: "Describe an innovative solution you implemented that significantly improved team productivity or system performance.",
              placeholder: "Detail the problem, your innovative approach, implementation, and measurable impact...",
              isRequired: true,
              order: 12,
              fieldWidth: "100%"
            },
            {
              fieldName: "futureVision",
              fieldType: "TEXTAREA",
              label: "Where do you see software development heading in the next 5 years? How are you preparing yourself and your team for these changes?",
              placeholder: "Share your perspective on industry trends, emerging technologies, and preparation strategies...",
              isRequired: true,
              order: 13,
              fieldWidth: "100%"
            },
            
            // Communication & Stakeholder Management
            {
              fieldName: "stakeholderCommunication",
              fieldType: "TEXTAREA",
              label: "How do you communicate complex technical concepts to non-technical stakeholders? Provide an example.",
              placeholder: "Describe your communication strategies, specific examples, and outcomes...",
              isRequired: true,
              order: 14,
              fieldWidth: "100%"
            },
            
            // Portfolio and Documentation
            {
              fieldName: "portfolioLinks",
              fieldType: "TAGS",
              label: "Professional Portfolio (GitHub, LinkedIn, personal projects, publications)",
              placeholder: "https://github.com/yourusername",
              isRequired: false,
              order: 15,
              fieldWidth: "100%"
            },
            {
              fieldName: "resumeUpload",
              fieldType: "FILE",
              label: "Upload Resume/CV",
              placeholder: "Upload your resume in PDF format",
              isRequired: true,
              order: 16,
              fieldWidth: "50%"
            },
            {
              fieldName: "expectedSalary",
              fieldType: "TEXT",
              label: "Expected Salary Range",
              placeholder: "$90,000 - $120,000",
              isRequired: false,
              order: 17,
              fieldWidth: "50%"
            }
          ]
        }
      }
    })

    console.log('✅ Sample forms created successfully!')
    console.log(`📝 Junior Developer Assessment Form ID: ${juniorForm.id}`)
    console.log(`📝 Senior Developer & Team Lead Assessment Form ID: ${seniorForm.id}`)
    
    // Now let's create sample jobs that use these forms
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
        salaryRange: "$45,000 - $65,000",
        jobType: "FULL_TIME",
        experience: "ENTRY_LEVEL",
        status: "ACTIVE",
        formId: juniorForm.id
      }
    })

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
        salaryRange: "$90,000 - $130,000",
        jobType: "FULL_TIME",
        experience: "SENIOR_LEVEL",
        status: "ACTIVE",
        formId: seniorForm.id
      }
    })

    console.log('✅ Sample jobs created successfully!')
    console.log(`💼 Junior Developer Job ID: ${juniorJob.id}`)
    console.log(`💼 Senior Developer Job ID: ${seniorJob.id}`)

    console.log('\n🎯 Forms are ready for testing!')
    console.log('📋 Junior Developer Assessment: Focuses on basic programming concepts, problem-solving, and learning attitude')
    console.log('📋 Senior Developer Assessment: Tests advanced architecture, leadership, and strategic thinking skills')

  } catch (error) {
    console.error('Error creating sample forms:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleForms()
