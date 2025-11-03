import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    // Security: Only allow certain file extensions
    const allowedExtensions = ['.pdf', '.doc', '.docx']
    const ext = path.extname(filename).toLowerCase()
    
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 403 })
    }

    // Construct the file path
    const filePath = path.join(process.cwd(), 'uploads', filename)
    
    // Check if file exists
    try {
      await stat(filePath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on extension
    let contentType = 'application/octet-stream'
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.doc':
        contentType = 'application/msword'
        break
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('File serving error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}