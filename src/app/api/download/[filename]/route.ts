import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params
    
    // Security check - only allow files from uploads directory
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const filePath = join(process.cwd(), 'uploads', filename)
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Determine content type based on file extension
      const ext = filename.toLowerCase().split('.').pop()
      let contentType = 'application/octet-stream'
      
      if (ext === 'pdf') {
        contentType = 'application/pdf'
      } else if (ext === 'doc') {
        contentType = 'application/msword'
      } else if (ext === 'docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
