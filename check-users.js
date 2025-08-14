const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    console.log('Existing users:', JSON.stringify(users, null, 2));
    
    // Also check roles
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        isSystem: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });
    console.log('\nExisting roles:', JSON.stringify(roles, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
