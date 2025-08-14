import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all roles
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to view roles or is a system admin
    const isSystemAdmin = user.role?.name === 'Administrator'
    const hasPermission = user.role?.permissions.some(rp => 
      rp.permission.module === 'roles' && rp.permission.action === 'read' && rp.granted
    )

    if (!hasPermission && !isSystemAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includePermissions = searchParams.get('includePermissions') === 'true'

    const roles = await prisma.role.findMany({
      include: {
        permissions: includePermissions ? {
          include: {
            permission: true
          }
        } : false,
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { isSystem: 'desc' }, // System roles first
        { name: 'asc' }
      ]
    })

    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      userCount: role.users.length,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      creator: role.creator,
      users: role.users,
      permissions: includePermissions ? role.permissions.map(rp => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        name: rp.permission.name,
        description: rp.permission.description,
        granted: rp.granted
      })) : undefined
    }))

    return NextResponse.json({
      roles: formattedRoles
    })
  } catch (error) {
    console.error('Roles API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to create roles
    const hasPermission = user.role?.permissions.some(rp => 
      rp.permission.module === 'roles' && rp.permission.action === 'create' && rp.granted
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, description, permissions, isActive = true } = await request.json()

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    })

    if (existingRole) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
    }

    // Create role with permissions
    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        isSystem: false, // Custom roles are never system roles
        isActive,
        creatorId: user.id,
        permissions: {
          create: permissions.map((permissionId: string) => ({
            permissionId,
            granted: true
          }))
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      role: {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        isSystem: newRole.isSystem,
        isActive: newRole.isActive,
        createdAt: newRole.createdAt.toISOString(),
        creator: newRole.creator,
        permissions: newRole.permissions.map(rp => ({
          id: rp.permission.id,
          module: rp.permission.module,
          action: rp.permission.action,
          name: rp.permission.name,
          granted: rp.granted
        }))
      }
    })

  } catch (error) {
    console.error('Create role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
