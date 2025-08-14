import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch archived applications
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
        role: true
      } as any
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to view archived applications
    const roleName = (user.role as any)?.name
    if (!['Administrator', 'Human Resources', 'Manager'].includes(roleName || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const statusParam = searchParams.get('status')
    const skip = (page - 1) * limit

    // Build the where clause for archived applications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      isArchived: true // Only show archived applications
    }
    if (statusParam) {
      const validStatuses = ['PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED']
      if (validStatuses.includes(statusParam)) {
        whereClause.status = statusParam
      }
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          job: {
            select: {
              title: true,
              position: true
            }
          },
          applicant: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          archivedAt: 'desc'
        }
      }),
      prisma.application.count({
        where: whereClause
      })
    ])

    const formattedApplications = applications.map(app => {
      // Use type assertion to access fields we know exist in the database
      const appWithCandidateData = app as typeof app & {
        candidateName?: string
        candidateEmail?: string
        archivedAt?: Date
      }
      
      // Use stored candidate data first, then fallback to formData parsing
      let candidateName = appWithCandidateData.candidateName || 'Unknown'
      let email = appWithCandidateData.candidateEmail || 'unknown@email.com'
      
      // If no candidate data in the application fields, try formData
      if (!candidateName || candidateName === 'Unknown' || !email || email === 'unknown@email.com') {
        try {
          const formData = JSON.parse(app.formData)
          
          // Try to find name and email from form data
          for (const [, value] of Object.entries(formData)) {
            if (typeof value === 'string') {
              // Detect email by @ symbol
              if (value.includes('@') && (!email || email === 'unknown@email.com')) {
                email = value
              } 
              // If it's not email and we don't have a name yet, assume it's name
              else if ((!candidateName || candidateName === 'Unknown') && !value.includes('@') && !/^\d+$/.test(value) && value.length > 1) {
                candidateName = value
              }
            }
          }
          
          // Fallback to traditional field names
          if (!candidateName || candidateName === 'Unknown') {
            candidateName = formData.name || formData.fullName || formData.candidateName || 'Unknown'
          }
          if (!email || email === 'unknown@email.com') {
            email = formData.email || 'unknown@email.com'
          }
        } catch (error) {
          console.error('Error parsing form data:', error)
        }
      }

      return {
        id: app.id,
        candidateName,
        position: app.job.title,
        status: app.status.replace('_', ' '),
        appliedAt: app.createdAt.toISOString(),
        archivedAt: appWithCandidateData.archivedAt?.toISOString(),
        email
      }
    })

    return NextResponse.json({
      applications: formattedApplications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Archived applications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Archive/Unarchive application
export async function PATCH(request: NextRequest) {
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
      include: { role: true } as any
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to archive applications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (user.role as any)?.name
    if (!['Administrator', 'Human Resources', 'Manager'].includes(roleName || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { applicationId, isArchived } = await request.json()

    if (!applicationId || typeof isArchived !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update archive status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        isArchived,
        archivedAt: isArchived ? new Date() : null,
        archivedBy: isArchived ? user.id : null
      }
    })

    return NextResponse.json({
      success: true,
      message: isArchived ? 'Application archived successfully' : 'Application unarchived successfully',
      application: {
        id: updatedApplication.id,
        isArchived: updatedApplication.isArchived
      }
    })

  } catch (error) {
    console.error('Archive application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
