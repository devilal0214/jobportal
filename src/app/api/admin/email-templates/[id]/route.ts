import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, type, subject, body: emailBody, isActive } = body

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        name,
        type,
        subject,
        body: emailBody,
        isActive
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating email template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.emailTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
