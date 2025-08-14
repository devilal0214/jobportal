import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jobSchema } from '@/lib/validations'
import { generateEmbedCode, verifyToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit
    
    const where: Record<string, unknown> = {}
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.job.count({ where }),
    ])
    
    // Map the jobs to include applicationsCount
    const jobsWithCount = jobs.map(job => ({
      ...job,
      applicationsCount: job._count.applications,
      _count: undefined, // Remove the _count object
    }))
    
    return NextResponse.json({
      jobs: jobsWithCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Jobs fetch error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      include: { role: true } as any
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions - only Administrator and Human Resources can create jobs
    const userRole = (user.role as unknown) as { name: string } | null
    if (!userRole || !['Administrator', 'Human Resources'].includes(userRole.name)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Validate input
    const validatedData = jobSchema.parse(body)
    
    // Create job
    const job = await prisma.job.create({
      data: {
        ...validatedData,
        creatorId: user.id,
      },
    })
    
    // Generate embed code
    const embedCode = generateEmbedCode(job.id)
    
    // Update job with embed code
    const updatedJob = await prisma.job.update({
      where: { id: job.id },
      data: { embedCode },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    })
    
    return NextResponse.json(updatedJob, { status: 201 })
  } catch (error) {
    console.error('Job creation error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
