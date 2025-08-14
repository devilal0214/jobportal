import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all permissions
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

    // Check if user has permission to view roles/permissions
    const hasPermission = user.role?.permissions?.some((rp: any) => 
      rp.permission.module === 'roles' && rp.permission.action === 'read' && rp.granted
    ) || (user.role as any)?.name === 'Administrator' // Temporarily allow admins

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      permissions: permissions.map(permission => ({
        id: permission.id,
        module: permission.module,
        action: permission.action,
        name: permission.name,
        description: permission.description
      }))
    })
  } catch (error) {
    console.error('Permissions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
