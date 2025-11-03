import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
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
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to archive applications
    const roleName = user.role?.name
    if (!['Administrator', 'Human Resources', 'Manager'].includes(roleName || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { isArchived } = await request.json()

    if (typeof isArchived !== 'boolean') {
      return NextResponse.json({ error: 'isArchived must be a boolean' }, { status: 400 })
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true, candidateName: true, isArchived: true }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update the application archive status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        isArchived,
        archivedAt: isArchived ? new Date() : null,
        archivedBy: isArchived ? user.id : null
      }
    })

    return NextResponse.json({ 
      message: `Application ${isArchived ? 'archived' : 'unarchived'} successfully`,
      application: {
        id: updatedApplication.id,
        isArchived: updatedApplication.isArchived,
        archivedAt: updatedApplication.archivedAt
      }
    })
  } catch (error) {
    console.error('Application archive error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}