import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isActive } = body

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: { isActive }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating email template status:', error)
    return NextResponse.json({ error: 'Failed to update template status' }, { status: 500 })
  }
}
