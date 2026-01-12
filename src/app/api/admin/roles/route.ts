import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch roles for user management
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      } as any
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permission to read roles
    const hasPermission = user.role?.permissions?.some((rp: any) => 
      rp.permission.module === 'roles' && rp.permission.action === 'read' && rp.granted
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch all active roles
    const rolesRaw = await prisma.$queryRaw`
      SELECT id, name, description, isSystem
      FROM roles 
      WHERE isActive = 1
      ORDER BY isSystem DESC, name ASC
    ` as Array<{
      id: string
      name: string
      description: string
      isSystem: number
    }>

    // Convert BigInt to regular numbers and format the response
    const roles = rolesRaw.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: Boolean(role.isSystem)
    }))

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Failed to fetch roles for user management:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}
