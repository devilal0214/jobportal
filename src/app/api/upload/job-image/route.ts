import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type - only allow png, jpg, jpeg, svg
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PNG, JPG, JPEG, and SVG images are allowed.' 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join('/home/jobs.jaiveeru.site/uploads', 'jobs')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
      console.log('Directory creation info:', error)
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${timestamp}_${image.name.replace(/\s+/g, '_')}`
    const filePath = path.join(uploadsDir, fileName)

    // Convert File to Buffer and save
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return the URL path
    const imageUrl = `/uploads/jobs/${fileName}`

    return NextResponse.json({ imageUrl }, { status: 200 })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
