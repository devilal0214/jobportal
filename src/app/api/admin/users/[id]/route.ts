import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, email, password, role } = await request.json()
    const { id: userId } = await params

    const updateData: {
      name: string;
      email: string;
      roleId?: string;
      password?: string;
    } = {
      name,
      email,
    }

    // Handle role update - use roleId field
    if (role) {
      updateData.roleId = role
    }

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await hashPassword(password)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      include: { role: true } as any
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to update user:', error)
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid role ID provided. The role does not exist.' },
          { status: 400 }
        )
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A user with this email already exists.' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
