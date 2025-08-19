const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function quickEmailTest() {
  console.log('📧 Quick Email System Test');
  console.log('==========================');
  
  // Check environment variables
  console.log('\n🔧 Environment Configuration:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || '❌ NOT SET'}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL || '❌ NOT SET'}`);
  
  // Test SMTP connection
  console.log('\n🔗 Testing SMTP Connection...');
  try {
    const transporter = nodemailer.createTransport({
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
    
    // Send a test email
    console.log('\n📧 Sending test email...');
    const testEmail = 'test@example.com'; // Replace with your email
    
    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: testEmail,
        subject: 'Job Portal Email Test',
        html: `
          <h2>Email System Test</h2>
          <p>This is a test email from your Job Portal application.</p>
          <p>If you receive this, your email system is working correctly!</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        `
      });
      
      console.log(`✅ Test email sent to: ${testEmail}`);
      console.log('📬 Check your inbox!');
      
      // Log to database
      await prisma.emailLog.create({
        data: {
          to: testEmail,
          subject: 'Job Portal Email Test',
          body: 'Test email body',
          status: 'sent'
        }
      });
      
    } catch (emailError) {
      console.error('❌ Failed to send test email:', emailError.message);
    }
    
  } catch (error) {
    console.error('❌ SMTP Connection failed:', error.message);
    console.log('\n💡 To fix this:');
    console.log('1. Update .env file with real email credentials');
    console.log('2. For Gmail: Enable 2FA and create App Password');
    console.log('3. Use format: SMTP_USER="youremail@gmail.com"');
    console.log('4. Use format: SMTP_PASS="your-16-digit-app-password"');
  }
  
  // Check existing email logs
  console.log('\n📊 Recent Email Activity:');
  try {
    const logs = await prisma.emailLog.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' }
    });
    
    if (logs.length > 0) {
      logs.forEach((log, index) => {
        const status = log.status === 'sent' ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${log.to} | ${log.subject} | ${log.sentAt.toLocaleString()}`);
      });
    } else {
      console.log('No email logs found');
    }
  } catch (dbError) {
    console.error('Database error:', dbError.message);
  }
  
  // Check system users for email testing
  console.log('\n👥 System Users for Testing:');
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      where: { isActive: true }
    });
    
    users.forEach(user => {
      console.log(`${user.role?.name || 'No Role'}: ${user.email}`);
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
  }
  
  await prisma.$disconnect();
}

quickEmailTest();
