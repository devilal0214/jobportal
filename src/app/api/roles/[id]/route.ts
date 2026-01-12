import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Update role and permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user has permission to update roles
    const hasPermission = user.role?.permissions.some(rp => 
      rp.permission.module === 'roles' && rp.permission.action === 'update' && rp.granted
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const roleId = params.id
    const { name, description, permissions, isActive } = await request.json()

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if new name conflicts with existing role (if name is changing)
    if (name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
      }
    }

    // Update role with new permissions
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name, // Allow changing system role names now
        description,
        isActive: isActive !== undefined ? isActive : existingRole.isActive,
        permissions: {
          deleteMany: {}, // Remove all existing permissions
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
      message: 'Role updated successfully',
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        isSystem: updatedRole.isSystem,
        isActive: updatedRole.isActive,
        createdAt: updatedRole.createdAt.toISOString(),
        updatedAt: updatedRole.updatedAt.toISOString(),
        creator: updatedRole.creator,
        permissions: updatedRole.permissions.map(rp => ({
          id: rp.permission.id,
          module: rp.permission.module,
          action: rp.permission.action,
          name: rp.permission.name,
          granted: rp.granted
        }))
      }
    })

  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user has permission to delete roles
    const hasPermission = user.role?.permissions.some(rp => 
      rp.permission.module === 'roles' && rp.permission.action === 'delete' && rp.granted
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const roleId = params.id

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Don't allow deleting Administrator role (core system role)
    if (existingRole.isSystem && existingRole.name === 'Administrator') {
      return NextResponse.json({ error: 'Cannot delete Administrator role' }, { status: 400 })
    }

    // Don't allow deleting roles that are assigned to users
    if (existingRole._count.users > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. It is assigned to ${existingRole._count.users} user(s)` 
      }, { status: 400 })
    }

    // Delete the role (this will cascade delete permissions due to schema)
    await prisma.role.delete({
      where: { id: roleId }
    })

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    })

  } catch (error) {
    console.error('Delete role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
