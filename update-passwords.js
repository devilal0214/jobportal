const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateUserPasswords() {
  try {
    const defaultPassword = 'password123'; // Default password for testing
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Update all users to have the default password
    const users = await prisma.user.findMany({
      select: { id: true, email: true, password: true }
    });
    
    console.log('Found users:', users.length);
    
    for (const user of users) {
      if (!user.password) {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log(`✅ Set password for ${user.email}`);
      } else {
        console.log(`⚠️ ${user.email} already has a password`);
      }
    }
    
    console.log(`\n🔐 Default password for all users: ${defaultPassword}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPasswords();
