const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@jobportal.com' }
    });
    
    if (user) {
      console.log('User found:', user.email);
      
      // Test different passwords
      const passwords = ['admin123', 'password123', 'password', 'admin'];
      
      for (const pwd of passwords) {
        const isValid = await bcrypt.compare(pwd, user.password);
        console.log(`Password "${pwd}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();
