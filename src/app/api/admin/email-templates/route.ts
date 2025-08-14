import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, subject, body: emailBody, isActive } = body

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        type,
        subject,
        body: emailBody,
        variables: JSON.stringify([]),
        isActive
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
