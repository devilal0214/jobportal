const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRoles() {
  try {
    console.log('=== ROLES DEBUG ===\n')
    
    // Check all roles
    const roles = await prisma.role.findMany()
    console.log('Available roles:')
    roles.forEach(role => {
      console.log(`- ID: ${role.id}, Name: "${role.name}"`)
    })
    
    // Check all users with roles
    const users = await prisma.user.findMany({
      include: { role: true }
    })
    console.log('\nUsers and their roles:')
    users.forEach(user => {
      console.log(`- User: ${user.name} | Email: ${user.email} | Role: ${user.role?.name || 'No role'}`)
    })
    
    // Check forms
    const forms = await prisma.form.findMany({
      include: { _count: { select: { fields: true } } }
    })
    console.log('\nAvailable forms:')
    forms.forEach(form => {
      console.log(`- ID: ${form.id}, Name: "${form.name}", Fields: ${form._count.fields}, Default: ${form.isDefault}`)
    })
    
    console.log('\n=== END DEBUG ===')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRoles()
