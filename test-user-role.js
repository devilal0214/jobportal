const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserWithRole() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@jobportal.com' },
      include: {
        role: true
      }
    });
    
    console.log('User with role:', JSON.stringify(user, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUserWithRole();
