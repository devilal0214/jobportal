import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.job.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Job deleted' })
  } catch (error) {
    console.error('Job delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
