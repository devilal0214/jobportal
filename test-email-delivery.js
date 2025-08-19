const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Email testing configuration
const EMAIL_TEST_CONFIG = {
  // Update these with actual email addresses for testing
  CANDIDATE_EMAIL: 'candidate@test.com',
  ADMIN_EMAIL: 'admin@test.com', 
  HR_EMAIL: 'hr@test.com',
  MANAGER_EMAIL: 'manager@test.com'
};

class EmailTester {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async testSMTPConnection() {
    console.log('🔧 Testing SMTP Connection...');
    console.log('================================');
    console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`SMTP Port: ${process.env.SMTP_PORT}`);
    console.log(`SMTP User: ${process.env.SMTP_USER}`);
    console.log(`From Email: ${process.env.FROM_EMAIL}`);
    
    try {
      await this.transporter.verify();
      console.log('✅ SMTP Connection successful!');
      return true;
    } catch (error) {
      console.error('❌ SMTP Connection failed:', error.message);
      console.log('\n💡 Common fixes:');
      console.log('1. Check SMTP credentials in .env file');
      console.log('2. Enable 2FA and use App Password for Gmail');
      console.log('3. Check firewall/network restrictions');
      return false;
    }
  }

  async sendTestEmail(to, subject, content, scenario) {
    try {
      console.log(`📧 Sending test email to: ${to}`);
      console.log(`📝 Subject: ${subject}`);
      
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: to,
        subject: subject,
        html: content,
      });

      console.log(`✅ Email sent successfully for ${scenario}`);
      console.log(`📬 Message ID: ${info.messageId}`);
      
      // Log to database
      await prisma.emailLog.create({
        data: {
          to: to,
          subject: subject,
          body: content,
          status: 'sent'
        }
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email for ${scenario}:`, error.message);
      
      // Log failed attempt
      await prisma.emailLog.create({
        data: {
          to: to,
          subject: subject,
          body: content,
          status: 'failed'
        }
      });
      
      return false;
    }
  }

  async getSystemUsers() {
    try {
      const users = await prisma.user.findMany({
        include: {
          role: true
        },
        where: {
          isActive: true
        }
      });

      const systemUsers = {
        admin: users.find(u => u.role?.name === 'Administrator'),
        hr: users.find(u => u.role?.name === 'Human Resources'),
        manager: users.find(u => u.role?.name === 'Manager')
      };

      console.log('👥 System Users Found:');
      console.log(`Admin: ${systemUsers.admin?.email || 'Not found'}`);
      console.log(`HR: ${systemUsers.hr?.email || 'Not found'}`);
      console.log(`Manager: ${systemUsers.manager?.email || 'Not found'}`);

      return systemUsers;
    } catch (error) {
      console.error('Error fetching system users:', error);
      return {};
    }
  }

  async getTestApplication() {
    try {
      const application = await prisma.application.findFirst({
        include: {
          job: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!application) {
        console.log('❌ No applications found for testing');
        return null;
      }

      // Extract candidate info from form data
      let candidateInfo = {};
      try {
        const formData = JSON.parse(application.formData);
        candidateInfo = {
          name: formData['Full Name'] || formData['name'] || 'Test Candidate',
          email: formData['Email Address'] || formData['email'] || EMAIL_TEST_CONFIG.CANDIDATE_EMAIL
        };
      } catch (error) {
        console.log('Could not parse form data, using defaults');
        candidateInfo = {
          name: 'Test Candidate',
          email: EMAIL_TEST_CONFIG.CANDIDATE_EMAIL
        };
      }

      console.log(`📋 Using test application: ${application.id}`);
      console.log(`💼 Job: ${application.job.title}`);
      console.log(`👤 Candidate: ${candidateInfo.name} (${candidateInfo.email})`);

      return { application, candidateInfo };
    } catch (error) {
      console.error('Error fetching test application:', error);
      return null;
    }
  }

  async testApplicationStatusChangeEmails() {
    console.log('\n📧 Testing Application Status Change Emails');
    console.log('===========================================');

    const testData = await this.getTestApplication();
    if (!testData) return false;

    const { application, candidateInfo } = testData;
    const systemUsers = await this.getSystemUsers();

    const statusTests = [
      {
        status: 'SHORTLISTED',
        candidateSubject: `Great news! You've been shortlisted for ${application.job.title}`,
        adminSubject: `Application Status Update - ${candidateInfo.name} shortlisted for ${application.job.title}`
      },
      {
        status: 'SELECTED',
        candidateSubject: `Congratulations! You've been selected for ${application.job.title}`,
        adminSubject: `Application Status Update - ${candidateInfo.name} selected for ${application.job.title}`
      },
      {
        status: 'REJECTED',
        candidateSubject: `Update on your application for ${application.job.title}`,
        adminSubject: `Application Status Update - ${candidateInfo.name} not selected for ${application.job.title}`
      }
    ];

    let allSuccess = true;

    for (const test of statusTests) {
      console.log(`\n🔄 Testing ${test.status} status change...`);

      // Email to candidate
      const candidateContent = this.generateStatusChangeEmailContent(
        candidateInfo.name,
        application.job.title,
        test.status,
        application.id,
        'candidate'
      );

      const candidateSuccess = await this.sendTestEmail(
        candidateInfo.email,
        test.candidateSubject,
        candidateContent,
        `${test.status} - Candidate`
      );

      // Email to system users
      const adminContent = this.generateStatusChangeEmailContent(
        candidateInfo.name,
        application.job.title,
        test.status,
        application.id,
        'admin'
      );

      // Send to Admin
      if (systemUsers.admin?.email) {
        const adminSuccess = await this.sendTestEmail(
          systemUsers.admin.email,
          test.adminSubject,
          adminContent,
          `${test.status} - Admin`
        );
        allSuccess = allSuccess && adminSuccess;
      }

      // Send to HR
      if (systemUsers.hr?.email) {
        const hrSuccess = await this.sendTestEmail(
          systemUsers.hr.email,
          test.adminSubject,
          adminContent,
          `${test.status} - HR`
        );
        allSuccess = allSuccess && hrSuccess;
      }

      // Send to Manager
      if (systemUsers.manager?.email) {
        const managerSuccess = await this.sendTestEmail(
          systemUsers.manager.email,
          test.adminSubject,
          adminContent,
          `${test.status} - Manager`
        );
        allSuccess = allSuccess && managerSuccess;
      }

      allSuccess = allSuccess && candidateSuccess;

      console.log(`${allSuccess ? '✅' : '❌'} ${test.status} email test completed`);
    }

    return allSuccess;
  }

  async testJobApplicationSubmissionEmails() {
    console.log('\n📧 Testing Job Application Submission Emails');
    console.log('===========================================');

    const testData = await this.getTestApplication();
    if (!testData) return false;

    const { application, candidateInfo } = testData;
    const systemUsers = await this.getSystemUsers();

    // Email to candidate
    const candidateSubject = `Application Received - ${application.job.title}`;
    const candidateContent = this.generateApplicationReceivedEmailContent(
      candidateInfo.name,
      application.job.title,
      application.id,
      'candidate'
    );

    const candidateSuccess = await this.sendTestEmail(
      candidateInfo.email,
      candidateSubject,
      candidateContent,
      'Application Submission - Candidate'
    );

    // Email to system users
    const adminSubject = `New Job Application - ${application.job.title}`;
    const adminContent = this.generateApplicationReceivedEmailContent(
      candidateInfo.name,
      application.job.title,
      application.id,
      'admin'
    );

    let allSuccess = candidateSuccess;

    // Send to Admin
    if (systemUsers.admin?.email) {
      const adminSuccess = await this.sendTestEmail(
        systemUsers.admin.email,
        adminSubject,
        adminContent,
        'Application Submission - Admin'
      );
      allSuccess = allSuccess && adminSuccess;
    }

    // Send to HR
    if (systemUsers.hr?.email) {
      const hrSuccess = await this.sendTestEmail(
        systemUsers.hr.email,
        adminSubject,
        adminContent,
        'Application Submission - HR'
      );
      allSuccess = allSuccess && hrSuccess;
    }

    // Send to Manager
    if (systemUsers.manager?.email) {
      const managerSuccess = await this.sendTestEmail(
        systemUsers.manager.email,
        adminSubject,
        adminContent,
        'Application Submission - Manager'
      );
      allSuccess = allSuccess && managerSuccess;
    }

    console.log(`${allSuccess ? '✅' : '❌'} Job application submission email test completed`);
    return allSuccess;
  }

  generateStatusChangeEmailContent(candidateName, jobTitle, status, applicationId, recipient) {
    const isCandidate = recipient === 'candidate';
    
    if (isCandidate) {
      switch (status) {
        case 'SHORTLISTED':
          return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Congratulations! You've been shortlisted</h2>
              <p>Dear ${candidateName},</p>
              <p>We're pleased to inform you that your application for the position of <strong>${jobTitle}</strong> has been shortlisted for the next stage of our selection process.</p>
              <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin-top: 0; color: #374151;">Application Details:</h3>
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Application ID:</strong> ${applicationId}</p>
                <p><strong>Status:</strong> Shortlisted</p>
              </div>
              <p>We will contact you soon with details about the next steps in the process.</p>
              <p>Best regards,<br>HR Team</p>
            </div>
          `;
        
        case 'SELECTED':
          return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Congratulations! You've been selected</h2>
              <p>Dear ${candidateName},</p>
              <p>We are delighted to inform you that you have been selected for the position of <strong>${jobTitle}</strong>.</p>
              <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin-top: 0; color: #374151;">Application Details:</h3>
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Application ID:</strong> ${applicationId}</p>
                <p><strong>Status:</strong> Selected</p>
              </div>
              <p>We will contact you soon with the offer details and next steps.</p>
              <p>Best regards,<br>HR Team</p>
            </div>
          `;
        
        case 'REJECTED':
          return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #374151;">Thank you for your application</h2>
              <p>Dear ${candidateName},</p>
              <p>Thank you for your interest in the position of <strong>${jobTitle}</strong>.</p>
              <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.</p>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin-top: 0; color: #374151;">Application Details:</h3>
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Application ID:</strong> ${applicationId}</p>
                <p><strong>Status:</strong> Not selected</p>
              </div>
              <p>We encourage you to apply for future opportunities that match your skills and experience.</p>
              <p>Best regards,<br>HR Team</p>
            </div>
          `;
      }
    } else {
      // Admin/HR/Manager notification
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Application Status Update</h2>
          <p>A job application status has been updated in the system.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #374151;">Application Details:</h3>
            <p><strong>Candidate:</strong> ${candidateName}</p>
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Application ID:</strong> ${applicationId}</p>
            <p><strong>New Status:</strong> ${status}</p>
            <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="margin: 24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/applications/${applicationId}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Application
            </a>
          </div>
          <p>Best regards,<br>Job Portal System</p>
        </div>
      `;
    }
  }

  generateApplicationReceivedEmailContent(candidateName, jobTitle, applicationId, recipient) {
    const isCandidate = recipient === 'candidate';
    
    if (isCandidate) {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Application Received</h2>
          <p>Dear ${candidateName},</p>
          <p>Thank you for your interest in the <strong>${jobTitle}</strong> position.</p>
          <p>We have successfully received your application and our team will review it shortly. You will hear from us within the next few business days.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #374151;">Application Details:</h3>
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Application ID:</strong> ${applicationId}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Best regards,<br>HR Team</p>
        </div>
      `;
    } else {
      // Admin/HR/Manager notification
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Job Application</h2>
          <p>A new job application has been submitted.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #374151;">Application Details:</h3>
            <p><strong>Candidate:</strong> ${candidateName}</p>
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Application ID:</strong> ${applicationId}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="margin: 24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/applications/${applicationId}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Application
            </a>
          </div>
          <p>Please review the application at your earliest convenience.</p>
          <p>Best regards,<br>Job Portal System</p>
        </div>
      `;
    }
  }

  async checkEmailLogs() {
    console.log('\n📊 Email Logs Summary');
    console.log('====================');

    try {
      const logs = await prisma.emailLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      const sentCount = logs.filter(log => log.status === 'sent').length;
      const failedCount = logs.filter(log => log.status === 'failed').length;

      console.log(`📧 Total recent emails: ${logs.length}`);
      console.log(`✅ Sent: ${sentCount}`);
      console.log(`❌ Failed: ${failedCount}`);

      if (logs.length > 0) {
        console.log('\n📋 Recent Email Logs:');
        logs.forEach((log, index) => {
          console.log(`${index + 1}. ${log.status === 'sent' ? '✅' : '❌'} To: ${log.to} | Subject: ${log.subject} | ${log.createdAt.toLocaleString()}`);
        });
      }

    } catch (error) {
      console.error('Error fetching email logs:', error);
    }
  }
}

async function runEmailTests() {
  console.log('🚀 Job Portal Email Testing Suite');
  console.log('=====================================');
  
  const tester = new EmailTester();
  
  try {
    // Step 1: Test SMTP connection
    const smtpConnected = await tester.testSMTPConnection();
    if (!smtpConnected) {
      console.log('\n❌ Cannot proceed with email tests - SMTP connection failed');
      console.log('\n🔧 Please check your .env file:');
      console.log('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL');
      return;
    }

    console.log('\n⚠️  IMPORTANT: Update EMAIL_TEST_CONFIG in this script with real email addresses');
    console.log('Current test emails will be sent to:');
    console.log(`- Candidate: ${EMAIL_TEST_CONFIG.CANDIDATE_EMAIL}`);
    console.log(`- Admin: ${EMAIL_TEST_CONFIG.ADMIN_EMAIL}`);
    console.log(`- HR: ${EMAIL_TEST_CONFIG.HR_EMAIL}`);
    console.log(`- Manager: ${EMAIL_TEST_CONFIG.MANAGER_EMAIL}`);
    
    // Step 2: Test application submission emails
    await tester.testJobApplicationSubmissionEmails();
    
    // Step 3: Test status change emails
    await tester.testApplicationStatusChangeEmails();
    
    // Step 4: Show email logs
    await tester.checkEmailLogs();
    
    console.log('\n🎉 Email testing completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Check your email inboxes for test emails');
    console.log('2. Update the EMAIL_TEST_CONFIG with real email addresses');
    console.log('3. Run this script again to test with real emails');
    console.log('4. Check the email logs in your admin panel');

  } catch (error) {
    console.error('❌ Email testing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runEmailTests();
