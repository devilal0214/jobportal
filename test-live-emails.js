const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApplicationStatusChange() {
  console.log('🔄 Testing Live Application Status Change Emails');
  console.log('===============================================');
  
  try {
    // Get a recent application to test with
    const application = await prisma.application.findFirst({
      include: {
        job: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!application) {
      console.log('❌ No applications found for testing');
      console.log('💡 Please submit a test application first:');
      console.log('   1. Go to http://localhost:3000/jobs');
      console.log('   2. Click "Apply" on any job');
      console.log('   3. Fill out and submit the form');
      return;
    }
    
    console.log(`📋 Using Application: ${application.id}`);
    console.log(`💼 Job: ${application.job.title}`);
    console.log(`📧 Current Status: ${application.status}`);
    
    // Extract candidate email from form data
    let candidateEmail = 'test@example.com';
    try {
      const formData = JSON.parse(application.formData);
      candidateEmail = formData['Email Address'] || formData['email'] || candidateEmail;
    } catch (e) {
      console.log('Could not parse application form data');
    }
    
    console.log(`👤 Candidate Email: ${candidateEmail}`);
    
    // Test status changes via API calls
    const statusTests = ['SHORTLISTED', 'SELECTED', 'REJECTED'];
    const baseUrl = 'http://localhost:3000';
    
    for (const newStatus of statusTests) {
      console.log(`\n🔄 Testing status change to: ${newStatus}`);
      
      try {
        const response = await fetch(`${baseUrl}/api/applications/${application.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log(`✅ Status updated successfully`);
          console.log(`📧 Email sent: ${result.emailSent ? 'Yes' : 'No'}`);
          
          if (result.emailSent) {
            console.log(`   → Email should be sent to: ${candidateEmail}`);
            console.log(`   → System users should also receive notifications`);
          }
        } else {
          console.log(`❌ Status update failed: ${result.error}`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ API call failed for ${newStatus}:`, error.message);
      }
    }
    
    // Check email logs after testing
    console.log('\n📊 Recent Email Logs (after testing):');
    const recentLogs = await prisma.emailLog.findMany({
      take: 10,
      orderBy: { sentAt: 'desc' }
    });
    
    recentLogs.forEach((log, index) => {
      const status = log.status === 'sent' ? '✅' : '❌';
      const time = log.sentAt.toLocaleTimeString();
      console.log(`${index + 1}. ${status} ${log.to} | ${log.subject} | ${time}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function testApplicationSubmission() {
  console.log('\n📝 Testing Live Application Submission');
  console.log('=====================================');
  
  try {
    // Get a job to apply to
    const job = await prisma.job.findFirst({
      where: { status: 'ACTIVE' }
    });
    
    if (!job) {
      console.log('❌ No active jobs found for testing');
      return;
    }
    
    console.log(`💼 Testing application for: ${job.title}`);
    
    const testApplication = {
      jobId: job.id,
      formData: {
        "Full Name": "Email Test Candidate",
        "Email Address": "emailtest@example.com",
        "Phone Number": "+1234567890",
        "Years of Experience": "3 years"
      },
      fieldLabels: {
        "Full Name": "Full Name",
        "Email Address": "Email Address", 
        "Phone Number": "Phone Number",
        "Years of Experience": "Years of Experience"
      }
    };
    
    console.log('📧 Submitting application (should trigger emails)...');
    
    try {
      const response = await fetch('http://localhost:3000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testApplication)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Application submitted successfully!');
        console.log(`📋 Application ID: ${result.applicationId}`);
        console.log('📧 Check email logs for notifications sent to:');
        console.log('   → Candidate: emailtest@example.com');
        console.log('   → Admin: team@jaiveeru.co.in');
        console.log('   → HR: hr@jobportal.com');
        console.log('   → Manager: manager@jobportal.com');
        
        // Return the application ID for status testing
        return result.applicationId;
      } else {
        console.log(`❌ Application submission failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ Application submission error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

async function runCompleteEmailTest() {
  console.log('🚀 Complete Email System Test');
  console.log('=============================');
  
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('1. Make sure development server is running (npm run dev)');
  console.log('2. Update SMTP credentials in .env for actual email delivery');
  console.log('3. Check spam folders if emails are not received');
  console.log('4. Current system shows email logs but actual delivery depends on SMTP config');
  
  // Test 1: Application Submission
  const newAppId = await testApplicationSubmission();
  
  // Test 2: Status Changes
  await testApplicationStatusChange();
  
  console.log('\n🎉 Email testing completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Update SMTP credentials in .env with real email settings');
  console.log('2. Test with real email addresses');
  console.log('3. Check email delivery in your inbox');
  console.log('4. Monitor email logs for delivery status');
}

runCompleteEmailTest();
