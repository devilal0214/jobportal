const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmailFormSetup() {
  console.log('🧪 Testing Email Form Setup');
  console.log('============================');

  try {
    // Check email templates
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true }
    });
    
    console.log(`📋 Active Email Templates: ${templates.length}`);
    templates.forEach(template => {
      console.log(`  • ${template.name} (${template.type})`);
    });

    // Check system users with roles
    const users = await prisma.user.findMany({
      include: { role: true },
      where: { isActive: true }
    });

    console.log(`\n👥 System Users: ${users.length}`);
    const roleGroups = {};
    users.forEach(user => {
      const roleName = user.role?.name || 'No Role';
      if (!roleGroups[roleName]) {
        roleGroups[roleName] = [];
      }
      roleGroups[roleName].push(user);
    });

    Object.entries(roleGroups).forEach(([role, userList]) => {
      console.log(`  ${role}: ${userList.length} users`);
      userList.forEach(user => {
        console.log(`    • ${user.name} (${user.email})`);
      });
    });

    // Check if roles exist
    const roles = await prisma.role.findMany({
      where: { isSystem: true, isActive: true }
    });

    console.log(`\n🛡️ System Roles: ${roles.length}`);
    roles.forEach(role => {
      console.log(`  • ${role.name} - ${role.description}`);
    });

    // Test data validation
    console.log('\n✅ Email Form Requirements Check:');
    
    const hasStatusTemplates = templates.some(t => 
      ['APPLICATION_STATUS', 'APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED'].includes(t.type)
    );
    console.log(`  Email Templates for Statuses: ${hasStatusTemplates ? '✅' : '❌'}`);
    
    const hasSystemUsers = users.filter(u => u.role?.isSystem).length > 0;
    console.log(`  System Users Available: ${hasSystemUsers ? '✅' : '❌'}`);
    
    const hasAdminUsers = users.filter(u => u.role?.name === 'Administrator').length > 0;
    console.log(`  Admin Users: ${hasAdminUsers ? '✅' : '❌'}`);
    
    const hasHRUsers = users.filter(u => u.role?.name === 'Human Resources').length > 0;
    console.log(`  HR Users: ${hasHRUsers ? '✅' : '❌'}`);

    // Show template mapping
    console.log('\n📧 Template Mapping for Statuses:');
    const statusMappings = [
      { status: 'SHORTLISTED', template: 'APPLICATION_STATUS' },
      { status: 'SELECTED', template: 'APPLICATION_STATUS' },
      { status: 'REJECTED', template: 'APPLICATION_STATUS' },
      { status: 'UNDER_REVIEW', template: 'APPLICATION_STATUS' },
      { status: 'INTERVIEW', template: 'INTERVIEW_SCHEDULED' }
    ];

    statusMappings.forEach(mapping => {
      const template = templates.find(t => t.type === mapping.template);
      console.log(`  ${mapping.status} → ${template ? `✅ ${template.name}` : '❌ No template'}`);
    });

    console.log('\n🚀 Email Form Ready!');
    console.log('\nNext steps:');
    console.log('1. Go to: http://localhost:3000/admin/email-test');
    console.log('2. Select an application status');
    console.log('3. Choose user roles to receive emails');
    console.log('4. Click "Send Test Emails"');
    console.log('5. Check email logs and inboxes');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailFormSetup();
