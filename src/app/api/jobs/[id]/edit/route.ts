import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const authorization = request.headers.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      include: { role: true } as any
    })

    // Check permissions - only Administrator and Human Resources can edit jobs
    const userRole = (user?.role as unknown) as { name: string } | null
    if (!user || !userRole || !['Administrator', 'Human Resources'].includes(userRole.name)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, description, position, location, status, formId, imageUrl, bannerImageUrl, salary } = await request.json()

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      title,
      description,
      position: position || null,
      location: location || null,
      status
    }

    // Add optional fields if they exist
    if (formId !== undefined) {
      updateData.formId = formId || null
    }
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl || null
    }
    if (bannerImageUrl !== undefined) {
      updateData.bannerImageUrl = bannerImageUrl || null
    }
    if (salary !== undefined) {
      updateData.salary = salary || null
    }

    const job = await prisma.job.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}
