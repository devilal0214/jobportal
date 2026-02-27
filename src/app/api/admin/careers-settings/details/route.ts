
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, chmod } from 'fs/promises'
import { join } from 'path'
import { getUploadDir } from '@/lib/upload'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB

export async function POST(request: NextRequest) {
  console.log('🚀 [DETAILS] Request started')
  
  try {
    // Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    
    // Set up upload directory
    const uploadsDir = getUploadDir('careers')
    
    // Create directory if it doesn't exist
    // Note: getUploadDir might handle creation, but mkdir here ensures it.
    await mkdir(uploadsDir, { recursive: true })
    
    console.log(`📁 [DETAILS] Upload directory: ${uploadsDir}`)
    
    const settingsToSave: Record<string, string> = {}

    // Handle file uploads for icons
    const iconUploads = [
      { fieldName: 'facebookIconFile', settingName: 'detailsShareFacebookIcon' },
      { fieldName: 'linkedinIconFile', settingName: 'detailsShareLinkedinIcon' },
      { fieldName: 'whatsappIconFile', settingName: 'detailsShareWhatsappIcon' },
      { fieldName: 'mailIconFile', settingName: 'detailsShareMailIcon' }
    ]
    
    for (const { fieldName, settingName } of iconUploads) {
      const file = formData.get(fieldName) as File | null
      if (file && file.size > 0) {
        console.log(`📤 [DETAILS] Processing ${fieldName}: ${file.name}`)
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ 
            error: `${fieldName} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 1MB.` 
          }, { status: 400 })
        }
        
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ 
            error: `Invalid file type for ${fieldName}. Only PNG, JPG, JPEG, and SVG images are allowed.` 
          }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Determine file extension based on MIME type
        let ext = 'png'
        if (file.type === 'image/svg+xml') ext = 'svg'
        else if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = 'jpg'
        
        const filename = `details-share-${fieldName.replace('IconFile', '').toLowerCase()}-${Date.now()}.${ext}`
        const filepath = join(uploadsDir, filename)
        
        await writeFile(filepath, buffer)
        await chmod(filepath, 0o644)
        
        const publicPath = `/uploads/careers/${filename}`
        const dbKey = `careers_${settingName.replace(/([A-Z])/g, '_$1').toLowerCase()}`
        settingsToSave[dbKey] = publicPath
        
        console.log(`✅ [DETAILS] ${fieldName} uploaded: ${filepath} -> ${publicPath}`)
      }
    }

    // Handle regular form fields
    const detailsSettings = [
      'detailsFontFamily',
      'detailsFontSize',
      'detailsFontWeight',
      'detailsButtonBg',
      'detailsButtonColor', 
      'detailsButtonRadius',
      'detailsShareEnabled',
      'detailsShareWidth',
      'detailsShareHeight',
      'detailsShareRadius',
      'detailsShareFacebookIcon',
      'detailsShareFacebookUrl',
      'detailsShareLinkedinIcon',
      'detailsShareLinkedinUrl',
      'detailsShareWhatsappIcon',
      'detailsShareWhatsappUrl',
      'detailsShareMailIcon',
      'detailsShareMailUrl'
    ]

    detailsSettings.forEach(key => {
      const value = formData.get(key)
      if (value !== null) {
        const dbKey = `careers_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`
        settingsToSave[dbKey] = String(value)
      }
    })

    console.log('💾 [DETAILS] Saving settings:', Object.keys(settingsToSave))

    // Save to database
    await prisma.$transaction(async (tx) => {
      const existingKeys = await tx.settings.findMany({
        where: { key: { in: Object.keys(settingsToSave) } },
        select: { key: true }
      })
      
      const existingKeySet = new Set(existingKeys.map(s => s.key))
      const toUpdate: Array<{ key: string; value: string }> = []
      const toCreate: Array<{ key: string; value: string }> = []

      Object.entries(settingsToSave).forEach(([key, value]) => {
        if (existingKeySet.has(key)) {
          toUpdate.push({ key, value })
        } else {
          toCreate.push({ key, value })
        }
      })

      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(setting =>
            tx.settings.update({
              where: { key: setting.key },
              data: { value: setting.value }
            })
          )
        )
        console.log(`✅ [DETAILS] Updated ${toUpdate.length} settings`)
      }

      if (toCreate.length > 0) {
        await tx.settings.createMany({ data: toCreate })
        console.log(`✅ [DETAILS] Created ${toCreate.length} settings`)
      }
    })

    console.log('✅ [DETAILS] Settings saved successfully')
    return NextResponse.json({ success: true, message: 'Career Page Details settings saved!' })

  } catch (error) {
    console.error('❌ [DETAILS] Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save details settings' 
    }, { status: 500 })
  }
}
