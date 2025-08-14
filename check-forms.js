const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkForms() {
  try {
    const forms = await prisma.form.findMany();
    console.log('Forms in database:');
    forms.forEach(form => {
      console.log(`- ID: ${form.id}, Name: ${form.name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkForms();
