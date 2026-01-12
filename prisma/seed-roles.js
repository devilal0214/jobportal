const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding roles and permissions system...\n')

  // Define all available permissions
  const permissions = [
    // Dashboard permissions
    { module: 'dashboard', action: 'read', name: 'View Dashboard', description: 'View dashboard statistics and insights' },
    
    // Jobs permissions
    { module: 'jobs', action: 'create', name: 'Create Jobs', description: 'Create new job postings' },
    { module: 'jobs', action: 'read', name: 'View Jobs', description: 'View job postings and details' },
    { module: 'jobs', action: 'update', name: 'Edit Jobs', description: 'Edit existing job postings' },
    { module: 'jobs', action: 'delete', name: 'Delete Jobs', description: 'Delete job postings' },
    { module: 'jobs', action: 'assign', name: 'Assign Jobs', description: 'Assign jobs to other users' },
    { module: 'jobs', action: 'pause', name: 'Pause Jobs', description: 'Pause/unpause job postings' },
    
    // Applications permissions
    { module: 'applications', action: 'read', name: 'View Applications', description: 'View job applications' },
    { module: 'applications', action: 'update', name: 'Manage Applications', description: 'Update application status and add remarks' },
    { module: 'applications', action: 'archive', name: 'Archive Applications', description: 'Archive and unarchive applications' },
    { module: 'applications', action: 'export', name: 'Export Applications', description: 'Export application data' },
    { module: 'applications', action: 'delete', name: 'Delete Applications', description: 'Permanently delete applications' },
    
    // Users permissions
    { module: 'users', action: 'create', name: 'Create Users', description: 'Create new user accounts' },
    { module: 'users', action: 'read', name: 'View Users', description: 'View user accounts and profiles' },
    { module: 'users', action: 'update', name: 'Edit Users', description: 'Edit user accounts and profiles' },
    { module: 'users', action: 'delete', name: 'Delete Users', description: 'Delete user accounts' },
    { module: 'users', action: 'activate', name: 'Activate/Deactivate Users', description: 'Activate or deactivate user accounts' },
    
    // Roles permissions
    { module: 'roles', action: 'create', name: 'Create Roles', description: 'Create new roles' },
    { module: 'roles', action: 'read', name: 'View Roles', description: 'View roles and permissions' },
    { module: 'roles', action: 'update', name: 'Edit Roles', description: 'Edit roles and permissions' },
    { module: 'roles', action: 'delete', name: 'Delete Roles', description: 'Delete custom roles' },
    { module: 'roles', action: 'assign', name: 'Assign Roles', description: 'Assign roles to users' },
    
    // Settings permissions
    { module: 'settings', action: 'read', name: 'View Settings', description: 'View system settings' },
    { module: 'settings', action: 'update', name: 'Manage Settings', description: 'Update system settings and configuration' },
    
    // Email permissions
    { module: 'email', action: 'read', name: 'View Email Templates', description: 'View email templates and logs' },
    { module: 'email', action: 'update', name: 'Manage Email Templates', description: 'Edit email templates and settings' },
    
    // Forms permissions
    { module: 'forms', action: 'create', name: 'Create Forms', description: 'Create application forms' },
    { module: 'forms', action: 'read', name: 'View Forms', description: 'View application forms' },
    { module: 'forms', action: 'update', name: 'Edit Forms', description: 'Edit application forms' },
    { module: 'forms', action: 'delete', name: 'Delete Forms', description: 'Delete application forms' },
  ]

  // Create permissions
  console.log('📋 Creating permissions...')
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { module_action: { module: permission.module, action: permission.action } },
      update: {},
      create: permission
    })
  }
  console.log(`✅ Created ${permissions.length} permissions\n`)

  // Create system roles
  console.log('👥 Creating system roles...')
  
  // Admin role - full access
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Full system access with all permissions',
      isSystem: true,
      isActive: true
    }
  })

  // HR role - limited access
  const hrRole = await prisma.role.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: {
      name: 'Human Resources',
      description: 'HR staff with job and application management access',
      isSystem: true,
      isActive: true
    }
  })

  // Manager role - moderate access
  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Department managers with team oversight capabilities',
      isSystem: true,
      isActive: true
    }
  })

  // Viewer role - read-only access
  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Read-only access to applications and basic data',
      isSystem: true,
      isActive: true
    }
  })

  console.log('✅ Created system roles\n')

  // Assign permissions to roles
  console.log('🔐 Assigning permissions to roles...')

  // Get all permissions
  const allPermissions = await prisma.permission.findMany()

  // Admin gets all permissions
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
        granted: true
      }
    })
  }

  // HR permissions
  const hrPermissions = allPermissions.filter(p => 
    ['dashboard', 'jobs', 'applications', 'forms', 'email'].includes(p.module) ||
    (p.module === 'users' && ['read'].includes(p.action))
  )
  for (const permission of hrPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: hrRole.id, permissionId: permission.id } },
      update: {},
      create: {
        roleId: hrRole.id,
        permissionId: permission.id,
        granted: true
      }
    })
  }

  // Manager permissions
  const managerPermissions = allPermissions.filter(p => 
    ['dashboard', 'forms'].includes(p.module) ||
    (p.module === 'jobs' && ['create', 'read', 'update', 'assign'].includes(p.action)) ||
    (p.module === 'applications' && ['read', 'update', 'archive'].includes(p.action)) ||
    (p.module === 'forms' && ['create', 'read', 'update'].includes(p.action)) ||
    (p.module === 'users' && ['read'].includes(p.action))
  )
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: managerRole.id, permissionId: permission.id } },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
        granted: true
      }
    })
  }

  // Viewer permissions (read-only)
  const viewerPermissions = allPermissions.filter(p => 
    (p.module === 'dashboard' && p.action === 'read') ||
    (p.module === 'jobs' && p.action === 'read') ||
    (p.module === 'applications' && p.action === 'read')
  )
  for (const permission of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: permission.id } },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: permission.id,
        granted: true
      }
    })
  }

  console.log('✅ Assigned permissions to system roles\n')

  // Update existing users to have roles
  console.log('👤 Updating existing users with roles...')
  
  // Find existing users and assign them admin role if they don't have one
  const existingUsers = await prisma.user.findMany({
    where: { roleId: null }
  })

  for (const user of existingUsers) {
    // Assign admin role to first user, HR to others
    const roleToAssign = existingUsers.indexOf(user) === 0 ? adminRole.id : hrRole.id
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: roleToAssign }
    })
  }

  console.log(`✅ Updated ${existingUsers.length} existing users with roles\n`)

  // Create a demo admin user if no users exist
  const userCount = await prisma.user.count()
  if (userCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        email: 'admin@jobportal.com',
        password: hashedPassword,
        name: 'System Administrator',
        roleId: adminRole.id,
        isActive: true
      }
    })
    console.log('✅ Created demo admin user (admin@jobportal.com / admin123)\n')
  }

  console.log('🎉 Roles and permissions system seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`- ${permissions.length} permissions created`)
  console.log('- 4 system roles created (Administrator, HR, Manager, Viewer)')
  console.log(`- ${existingUsers.length} existing users updated`)
  console.log('\n🔐 System Roles:')
  console.log('- Administrator: Full access to all modules')
  console.log('- Human Resources: Jobs, applications, forms, email management')
  console.log('- Manager: View dashboard, manage assigned jobs, applications, and forms (create, read, update)')
  console.log('- Viewer: Read-only access to basic data')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
