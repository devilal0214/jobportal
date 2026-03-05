import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getUploadDir } from '@/lib/upload'

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload API] === FILE UPLOAD REQUEST STARTED ===')
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('[Upload API] File received:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'NO FILE')
    
    if (!file) {
      console.error('[Upload API] ERROR: No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    console.log('[Upload API] File validation - Type:', file.type, 'Size:', file.size, 'bytes')
    
    if (!allowedTypes.includes(file.type)) {
      console.error('[Upload API] ERROR: Invalid file type:', file.type)
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' 
      }, { status: 400 })
    }
    
    if (file.size > maxSize) {
      console.error('[Upload API] ERROR: File too large:', file.size, 'bytes (max:', maxSize, 'bytes)')
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Create uploads/applications directory if it doesn't exist
    const uploadDir = getUploadDir('applications')
    console.log('[Upload API] Target directory:', uploadDir)
    if (!existsSync(uploadDir)) {
      console.log('[Upload API] Directory does not exist, creating:', uploadDir)
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${sanitizedName}`
    const filePath = join(uploadDir, fileName)

    console.log('[Upload API] Saving file to:', filePath)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    console.log('[Upload API] File saved successfully:', fileName)
    console.log('[Upload API] === FILE UPLOAD COMPLETED SUCCESSFULLY ===')

    return NextResponse.json({
      success: true,
      fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      path: `applications/${fileName}`  // Include subdirectory in path for download route
    })

  } catch (error) {
    console.error('[Upload API] === FILE UPLOAD FAILED ===')
    console.error('[Upload API] Error details:', error)
    console.error('[Upload API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
