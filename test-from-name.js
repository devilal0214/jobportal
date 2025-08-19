// Test if From Name is properly configured for emails
const { PrismaClient } = require('@prisma/client');

async function testFromName() {
  console.log('🧪 Testing Email From Name configuration...\n');
  
  const prisma = new PrismaClient();
  
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: { in: ['emailFrom', 'emailFromName', 'from_email', 'from_name'] }
      }
    });
    
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    const fromEmail = settingsMap.emailFrom || settingsMap.from_email;
    const fromName = settingsMap.emailFromName || settingsMap.from_name;
    
    console.log('📊 Current Settings:');
    console.log(`   From Email: ${fromEmail}`);
    console.log(`   From Name: ${fromName}`);
    
    if (fromName && fromEmail) {
      const formattedFrom = `"${fromName}" <${fromEmail}>`;
      console.log(`\n✅ Formatted From field: ${formattedFrom}`);
      console.log(`🎉 Recipients will see emails from: ${fromName}`);
      console.log(`📧 Instead of just: ${fromEmail}`);
    } else if (fromEmail) {
      console.log('\n❌ No From Name configured');
      console.log(`📧 Emails will show only: ${fromEmail}`);
    } else {
      console.log('\n❌ No email settings configured');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error checking settings:', error);
    await prisma.$disconnect();
  }
}

testFromName();
