import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isActive } = await request.json()
    const userId = params.id

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to update user status:', error)
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    )
  }
}
