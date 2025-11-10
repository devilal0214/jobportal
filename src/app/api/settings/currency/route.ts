import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'default_currency' }
    })

    return NextResponse.json({ 
      currency: setting?.value || '₹' 
    })
  } catch (error) {
    console.error('Error fetching currency:', error)
    return NextResponse.json({ currency: '₹' })
  }
}
