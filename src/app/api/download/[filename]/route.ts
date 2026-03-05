import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import path from 'path'
import { getUploadDir } from '@/lib/upload'

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params
    
    // Security check - prevent directory traversal attacks
    if (!filename || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // Handle paths with subdirectories (e.g., "applications/file.pdf")
    // Replace forward slashes with path separators for the current OS
    const sanitizedPath = filename.replace(/\//g, path.sep)
    const filePath = join(getUploadDir(), sanitizedPath)
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Extract actual filename for Content-Disposition header
      const actualFilename = filename.split('/').pop() || filename
      
      // Determine content type based on file extension
      const ext = actualFilename.toLowerCase().split('.').pop()
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
          'Content-Disposition': `attachment; filename="${actualFilename}"`,
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
