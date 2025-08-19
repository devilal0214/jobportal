const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFromName() {
  try {
    const settings = await prisma.settings.findMany({
      where: { 
        key: { 
          in: ['emailFromName', 'emailFrom', 'from_name', 'from_email'] 
        } 
      }
    });
    
    console.log('📧 Current Email Settings:');
    settings.forEach(setting => {
      console.log(`   ${setting.key}: ${setting.value}`);
    });
    
    if (settings.length === 0) {
      console.log('   ❌ No email settings found');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkFromName();
