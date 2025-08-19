const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmailConfiguration() {
  console.log('📧 Email Configuration Check');
  console.log('============================');
  
  console.log('Environment Variables:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || '❌ NOT SET'}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET'}`);
  console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL || '❌ NOT SET'}`);
  
  // Check email templates
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true }
    });
    
    console.log(`\n📋 Active Email Templates: ${templates.length}`);
    templates.forEach(template => {
      console.log(`- ${template.name} (${template.type})`);
    });
    
    // Check email logs
    const recentLogs = await prisma.emailLog.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' }
    });
    
    console.log(`\n📊 Recent Email Logs: ${recentLogs.length}`);
    recentLogs.forEach(log => {
      console.log(`- ${log.status === 'sent' ? '✅' : '❌'} ${log.to} | ${log.subject} | ${log.sentAt.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailConfiguration();
