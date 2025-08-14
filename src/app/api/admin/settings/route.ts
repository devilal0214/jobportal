import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.settings.findMany()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Update or create each setting
    const updatePromises = Object.entries(body).map(async ([key, value]) => {
      return prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { 
          key, 
          value: String(value),
          type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'text'
        }
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
