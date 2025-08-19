const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// 🔧 CONFIGURATION - Update these with real email addresses for testing
const TEST_EMAILS = {
  CANDIDATE: 'candidate.test@example.com',  // Replace with your test email
  ADMIN: 'admin.test@example.com',         // Replace with admin email
  HR: 'hr.test@example.com',               // Replace with HR email  
  MANAGER: 'manager.test@example.com'      // Replace with manager email
};

class EmailDeliveryTester {
  constructor() {
    this.results = {
      smtpConnection: false,
      applicationSubmission: false,
      statusChanges: {
        shortlisted: false,
        selected: false,
        rejected: false
      },
      totalEmailsSent: 0
    };
  }

  async testSMTPConnection() {
    console.log('🔧 Testing SMTP Connection');
    console.log('==========================');
    
    console.log(`SMTP Configuration:`);
    console.log(`- Host: ${process.env.SMTP_HOST}`);
    console.log(`- Port: ${process.env.SMTP_PORT}`);
    console.log(`- User: ${process.env.SMTP_USER}`);
    console.log(`- From: ${process.env.FROM_EMAIL}`);
    
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.verify();
      console.log('✅ SMTP Connection successful!');
      this.results.smtpConnection = true;
      return transporter;
    } catch (error) {
      console.error('❌ SMTP Connection failed:', error.message);
      console.log('\n💡 To fix SMTP issues:');
      console.log('1. Update .env file with your actual email credentials:');
      console.log('   SMTP_USER="your-actual-email@gmail.com"');
      console.log('   SMTP_PASS="your-app-password"');
      console.log('2. For Gmail: Enable 2FA and create an App Password');
      console.log('3. For other providers: Check SMTP settings');
      return null;
    }
  }

  async getSystemUsersEmails() {
    try {
      const users = await prisma.user.findMany({
        include: { role: true },
        where: { isActive: true }
      });

      const systemEmails = {
        admin: users.find(u => u.role?.name === 'Administrator')?.email,
        hr: users.find(u => u.role?.name === 'Human Resources')?.email, 
        manager: users.find(u => u.role?.name === 'Manager')?.email
      };

      console.log('\n👥 System User Emails:');
      console.log(`Admin: ${systemEmails.admin || 'Not found'}`);
      console.log(`HR: ${systemEmails.hr || 'Not found'}`);
      console.log(`Manager: ${systemEmails.manager || 'Not found'}`);

      return systemEmails;
    } catch (error) {
      console.error('Error fetching system users:', error);
      return {};
    }
  }

  async getTestApplication() {
    try {
      const application = await prisma.application.findFirst({
        include: { job: true },
        orderBy: { sentAt: 'desc' }
      });

      if (!application) {
        console.log('❌ No applications found. Please submit a test application first.');
        return null;
      }

      // Extract candidate info
      let candidateInfo = { name: 'Test Candidate', email: TEST_EMAILS.CANDIDATE };
      try {
        const formData = JSON.parse(application.formData);
        candidateInfo = {
          name: formData['Full Name'] || formData['name'] || 'Test Candidate',
          email: formData['Email Address'] || formData['email'] || TEST_EMAILS.CANDIDATE
        };
      } catch (e) {
        // Use defaults
      }

      console.log(`\n📋 Test Application:`);
      console.log(`- ID: ${application.id}`);
      console.log(`- Job: ${application.job.title}`);
      console.log(`- Candidate: ${candidateInfo.name}`);
      console.log(`- Email: ${candidateInfo.email}`);

      return { application, candidateInfo };
    } catch (error) {
      console.error('Error fetching application:', error);
      return null;
    }
  }

  async sendTestEmail(transporter, to, subject, content, scenario) {
    try {
      console.log(`📧 Sending: ${scenario} → ${to}`);
      
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: to,
        subject: subject,
        html: content,
      });

      // Log to database
      await prisma.emailLog.create({
        data: {
          to: to,
          subject: subject,
          body: content,
          status: 'sent'
        }
      });

      console.log(`✅ Email sent: ${scenario}`);
      this.results.totalEmailsSent++;
      return true;
    } catch (error) {
      console.error(`❌ Failed to send ${scenario}:`, error.message);
      
      // Log failure
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

  // Test Scenario 1: Job Application Submission
  async testApplicationSubmissionEmails(transporter) {
    console.log('\n📧 Testing: Job Application Submission Emails');
    console.log('==============================================');

    const testData = await this.getTestApplication();
    if (!testData) return false;

    const { application, candidateInfo } = testData;
    const systemEmails = await this.getSystemUsersEmails();

    let allSuccess = true;

    // 1. Email to Candidate
    const candidateSubject = `Application Received - ${application.job.title}`;
    const candidateContent = this.generateCandidateApplicationEmail(
      candidateInfo.name, 
      application.job.title, 
      application.id
    );

    const candidateSuccess = await this.sendTestEmail(
      transporter,
      candidateInfo.email,
      candidateSubject,
      candidateContent,
      'Application Confirmation (Candidate)'
    );

    // 2. Email to Admin
    const adminSubject = `New Application - ${application.job.title}`;
    const adminContent = this.generateAdminNotificationEmail(
      candidateInfo.name,
      application.job.title,
      application.id,
      'New Application'
    );

    if (systemEmails.admin) {
      const adminSuccess = await this.sendTestEmail(
        transporter,
        systemEmails.admin,
        adminSubject,
        adminContent,
        'Admin Notification'
      );
      allSuccess = allSuccess && adminSuccess;
    }

    // 3. Email to HR
    if (systemEmails.hr) {
      const hrSuccess = await this.sendTestEmail(
        transporter,
        systemEmails.hr,
        adminSubject,
        adminContent,
        'HR Notification'
      );
      allSuccess = allSuccess && hrSuccess;
    }

    // 4. Email to Manager
    if (systemEmails.manager) {
      const managerSuccess = await this.sendTestEmail(
        transporter,
        systemEmails.manager,
        adminSubject,
        adminContent,
        'Manager Notification'
      );
      allSuccess = allSuccess && managerSuccess;
    }

    this.results.applicationSubmission = candidateSuccess && allSuccess;
    console.log(`${this.results.applicationSubmission ? '✅' : '❌'} Application submission email test`);
    
    return allSuccess;
  }

  // Test Scenario 2: Application Status Changes
  async testStatusChangeEmails(transporter) {
    console.log('\n📧 Testing: Application Status Change Emails');
    console.log('============================================');

    const testData = await this.getTestApplication();
    if (!testData) return false;

    const { application, candidateInfo } = testData;
    const systemEmails = await this.getSystemUsersEmails();

    const statusTests = [
      { status: 'SHORTLISTED', label: 'Shortlisted' },
      { status: 'SELECTED', label: 'Selected' },
      { status: 'REJECTED', label: 'Rejected' }
    ];

    for (const test of statusTests) {
      console.log(`\n🔄 Testing ${test.label} status...`);

      // Email to candidate
      const candidateSubject = this.getStatusSubject(test.status, application.job.title);
      const candidateContent = this.generateStatusChangeEmail(
        candidateInfo.name,
        application.job.title,
        application.id,
        test.status,
        'candidate'
      );

      const candidateSuccess = await this.sendTestEmail(
        transporter,
        candidateInfo.email,
        candidateSubject,
        candidateContent,
        `${test.label} Status (Candidate)`
      );

      // Email to system users  
      const adminSubject = `Status Update - ${candidateInfo.name} ${test.label} for ${application.job.title}`;
      const adminContent = this.generateStatusChangeEmail(
        candidateInfo.name,
        application.job.title,
        application.id,
        test.status,
        'admin'
      );

      let systemSuccess = true;
      
      if (systemEmails.admin) {
        const adminSuccess = await this.sendTestEmail(
          transporter,
          systemEmails.admin,
          adminSubject,
          adminContent,
          `${test.label} Admin Notification`
        );
        systemSuccess = systemSuccess && adminSuccess;
      }

      if (systemEmails.hr) {
        const hrSuccess = await this.sendTestEmail(
          transporter,
          systemEmails.hr,
          adminSubject,
          adminContent,
          `${test.label} HR Notification`
        );
        systemSuccess = systemSuccess && hrSuccess;
      }

      if (systemEmails.manager) {
        const managerSuccess = await this.sendTestEmail(
          transporter,
          systemEmails.manager,
          adminSubject,
          adminContent,
          `${test.label} Manager Notification`
        );
        systemSuccess = systemSuccess && managerSuccess;
      }

      const statusTestSuccess = candidateSuccess && systemSuccess;
      this.results.statusChanges[test.status.toLowerCase()] = statusTestSuccess;
      
      console.log(`${statusTestSuccess ? '✅' : '❌'} ${test.label} status email test`);
    }

    return true;
  }

  getStatusSubject(status, jobTitle) {
    switch (status) {
      case 'SHORTLISTED':
        return `Great news! You've been shortlisted for ${jobTitle}`;
      case 'SELECTED':
        return `Congratulations! You've been selected for ${jobTitle}`;
      case 'REJECTED':
        return `Update on your application for ${jobTitle}`;
      default:
        return `Application Status Update - ${jobTitle}`;
    }
  }

  generateCandidateApplicationEmail(candidateName, jobTitle, applicationId) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Application Received</h2>
        <p>Dear ${candidateName},</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position.</p>
        <p>We have successfully received your application and our team will review it shortly.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin-top: 0;">Application Details:</h3>
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>You will hear from us within the next few business days.</p>
        <p>Best regards,<br>HR Team</p>
      </div>
    `;
  }

  generateAdminNotificationEmail(candidateName, jobTitle, applicationId, type) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${type}</h2>
        <p>A new job application has been submitted.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin-top: 0;">Application Details:</h3>
          <p><strong>Candidate:</strong> ${candidateName}</p>
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/applications/${applicationId}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Application
          </a>
        </div>
        <p>Please review the application at your earliest convenience.</p>
        <p>Best regards,<br>Job Portal System</p>
      </div>
    `;
  }

  generateStatusChangeEmail(candidateName, jobTitle, applicationId, status, recipient) {
    const isCandidate = recipient === 'candidate';
    
    if (isCandidate) {
      switch (status) {
        case 'SHORTLISTED':
          return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Great News!</h2>
              <p>Dear ${candidateName},</p>
              <p>We're pleased to inform you that your application for <strong>${jobTitle}</strong> has been shortlisted.</p>
              <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Application ID:</strong> ${applicationId}</p>
                <p><strong>Status:</strong> Shortlisted for next round</p>
              </div>
              <p>We will contact you soon with details about the next steps.</p>
              <p>Best regards,<br>HR Team</p>
            </div>
          `;
        
        case 'SELECTED':
          return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Congratulations!</h2>
              <p>Dear ${candidateName},</p>
              <p>We are delighted to inform you that you have been selected for the <strong>${jobTitle}</strong> position.</p>
              <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Application ID:</strong> ${applicationId}</p>
                <p><strong>Status:</strong> Selected</p>
              </div>
              <p>We will contact you soon with the offer details.</p>
              <p>Best regards,<br>HR Team</p>
            </div>
          `;
        
        case 'REJECTED':
          return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #374151;">Application Update</h2>
              <p>Dear ${candidateName},</p>
              <p>Thank you for your interest in the <strong>${jobTitle}</strong> position.</p>
              <p>After careful consideration, we have decided to move forward with other candidates.</p>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Application ID:</strong> ${applicationId}</p>
                <p><strong>Status:</strong> Not selected</p>
              </div>
              <p>We encourage you to apply for future opportunities.</p>
              <p>Best regards,<br>HR Team</p>
            </div>
          `;
      }
    } else {
      // Admin notification
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Application Status Update</h2>
          <p>An application status has been updated.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Candidate:</strong> ${candidateName}</p>
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Application ID:</strong> ${applicationId}</p>
            <p><strong>New Status:</strong> ${status}</p>
            <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="margin: 24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/applications/${applicationId}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Application
            </a>
          </div>
          <p>Best regards,<br>Job Portal System</p>
        </div>
      `;
    }
  }

  async showResults() {
    console.log('\n📊 Email Delivery Test Results');
    console.log('===============================');
    console.log(`SMTP Connection: ${this.results.smtpConnection ? '✅' : '❌'}`);
    console.log(`Application Submission Emails: ${this.results.applicationSubmission ? '✅' : '❌'}`);
    console.log(`Status Change Emails:`);
    console.log(`  - Shortlisted: ${this.results.statusChanges.shortlisted ? '✅' : '❌'}`);
    console.log(`  - Selected: ${this.results.statusChanges.selected ? '✅' : '❌'}`);
    console.log(`  - Rejected: ${this.results.statusChanges.rejected ? '✅' : '❌'}`);
    console.log(`Total Emails Sent: ${this.results.totalEmailsSent}`);
    
    // Show recent email logs
    try {
      const recentLogs = await prisma.emailLog.findMany({
        take: 10,
        orderBy: { sentAt: 'desc' }
      });
      
      console.log(`\n📋 Recent Email Log (${recentLogs.length} entries):`);
      recentLogs.forEach((log, index) => {
        const status = log.status === 'sent' ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${log.to} | ${log.subject}`);
      });
    } catch (error) {
      console.log('Could not fetch email logs');
    }
  }
}

async function runEmailDeliveryTests() {
  console.log('🚀 Job Portal Email Delivery Testing Suite');
  console.log('===========================================');
  console.log('\n⚠️  IMPORTANT: Update TEST_EMAILS configuration with real email addresses!');
  console.log(`Current test emails:`);
  console.log(`- Candidate: ${TEST_EMAILS.CANDIDATE}`);
  console.log(`- Admin: ${TEST_EMAILS.ADMIN}`);
  console.log(`- HR: ${TEST_EMAILS.HR}`);
  console.log(`- Manager: ${TEST_EMAILS.MANAGER}`);
  
  const tester = new EmailDeliveryTester();
  
  try {
    // Step 1: Test SMTP Connection
    const transporter = await tester.testSMTPConnection();
    if (!transporter) {
      console.log('\n❌ Email testing cannot proceed without valid SMTP configuration');
      return;
    }

    // Step 2: Test Application Submission Emails
    await tester.testApplicationSubmissionEmails(transporter);

    // Step 3: Test Status Change Emails  
    await tester.testStatusChangeEmails(transporter);

    // Step 4: Show Results
    await tester.showResults();

    console.log('\n🎉 Email delivery testing completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Check your email inboxes for test emails');
    console.log('2. Update SMTP credentials in .env if emails are not received');
    console.log('3. Update TEST_EMAILS with real addresses and run again');
    console.log('4. Test the live application submission and status changes');

  } catch (error) {
    console.error('❌ Email testing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runEmailDeliveryTests();
