import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        _count: { select: { applications: true } },
      },
    })
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Fetch form separately if formId exists
    let form = null
    const jobWithFormId = job as any
    if (jobWithFormId.formId) {
      // @ts-expect-error - Prisma client type issue after generation
      form = await prisma.form.findUnique({
        where: { id: jobWithFormId.formId },
        include: {
          fields: {
            orderBy: { order: 'asc' }
          }
        }
      })
    }

    return NextResponse.json({ ...job, form })
  } catch (error) {
    console.error('Job detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
