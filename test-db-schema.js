// Test database roles and users
const { PrismaClient } = require('@prisma/client')

async function testDatabaseSchema() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing database for roles and forms...\n')
    
    // Test 1: Check roles
    console.log('1️⃣ Checking roles...')
    const roles = await prisma.role.findMany()
    roles.forEach(role => {
      console.log(`- Role ID: ${role.id}, Name: "${role.name}"`)
    })
    
    // Test 2: Check users with roles
    console.log('\n2️⃣ Checking users with roles...')
    const users = await prisma.user.findMany({
      include: { role: true }
    })
    users.forEach(user => {
      console.log(`- User: ${user.name} | Email: ${user.email} | Role: ${user.role?.name || 'No role'}`)
    })
    
    // Test 3: Check forms
    console.log('\n3️⃣ Checking forms...')
    const forms = await prisma.form.findMany({
      include: { _count: { select: { fields: true } } }
    })
    forms.forEach(form => {
      console.log(`- Form ID: ${form.id}, Name: "${form.name}", Fields: ${form._count.fields}, Default: ${form.isDefault}`)
    })
    
    console.log('\n✅ Database test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseSchema()
