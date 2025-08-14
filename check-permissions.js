// Comprehensive permissions and roles test
const { PrismaClient } = require('@prisma/client')

async function testPermissions() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔒 COMPREHENSIVE PERMISSIONS AUDIT\n')
    
    // Test 1: Check all users and their role assignments
    console.log('1️⃣ USER ROLE ASSIGNMENTS')
    const users = await prisma.user.findMany({
      include: { role: true }
    })
    
    users.forEach(user => {
      console.log(`   👤 ${user.name} (${user.email})`)
      console.log(`      📧 Active: ${user.isActive}`)
      console.log(`      🎭 Role: ${user.role?.name || 'NO ROLE ASSIGNED ⚠️'}`)
      console.log('')
    })
    
    // Test 2: Check role permissions
    console.log('2️⃣ ROLE DEFINITIONS')
    const roles = await prisma.role.findMany()
    roles.forEach(role => {
      console.log(`   🎭 ${role.name} (ID: ${role.id})`)
    })
    
    // Test 3: Check forms availability
    console.log('\n3️⃣ FORMS AVAILABILITY')
    const forms = await prisma.form.findMany({
      include: { 
        _count: { select: { fields: true } },
        fields: { take: 1 }
      }
    })
    
    if (forms.length === 0) {
      console.log('   ❌ NO FORMS FOUND - This is the main issue!')
    } else {
      forms.forEach(form => {
        console.log(`   📝 ${form.name}`)
        console.log(`      🔢 Fields: ${form._count.fields}`)
        console.log(`      ⭐ Default: ${form.isDefault}`)
        console.log(`      🆔 ID: ${form.id}`)
      })
    }
    
    // Test 4: Check jobs and their form assignments
    console.log('\n4️⃣ JOB FORM ASSIGNMENTS')
    const jobs = await prisma.job.findMany({
      include: { form: true },
      take: 5
    })
    
    if (jobs.length === 0) {
      console.log('   ℹ️ No jobs found')
    } else {
      jobs.forEach(job => {
        console.log(`   💼 ${job.title}`)
        console.log(`      📝 Form: ${job.form?.name || 'NO FORM ASSIGNED ⚠️'}`)
        console.log(`      📊 Status: ${job.status}`)
      })
    }
    
    // Test 5: Check if there are any permission/access issues
    console.log('\n5️⃣ PERMISSION SUMMARY')
    const adminUsers = users.filter(u => u.role?.name === 'Administrator')
    const hrUsers = users.filter(u => u.role?.name === 'Human Resources')
    const activeUsers = users.filter(u => u.isActive)
    
    console.log(`   👨‍💼 Administrators: ${adminUsers.length}`)
    console.log(`   👥 HR Users: ${hrUsers.length}`)
    console.log(`   ✅ Active Users: ${activeUsers.length}/${users.length}`)
    console.log(`   📋 Available Forms: ${forms.length}`)
    
    if (forms.length === 0) {
      console.log('\n❌ CRITICAL ISSUE: No forms found!')
      console.log('💡 Solution: Run create-sample-forms.js to create sample forms')
    } else if (adminUsers.length === 0 && hrUsers.length === 0) {
      console.log('\n❌ CRITICAL ISSUE: No admin or HR users found!')
      console.log('💡 Solution: Create admin users or update existing user roles')
    } else {
      console.log('\n✅ PERMISSIONS LOOK GOOD')
      console.log('   Forms are available and users have proper roles')
    }
    
  } catch (error) {
    console.error('❌ Permission test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testPermissions()
