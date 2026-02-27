
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
  console.log('🚀 [STYLING] Request started')
  
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const formData = await request.formData()
    const type = formData.get('type')
    
    // Set up upload directory
    const uploadsDir = getUploadDir('careers')
    
    // Create directory if it doesn't exist
    // The existsSync import was removed, assuming getUploadDir or subsequent mkdir handles existence.
    // If mkdir is called on an existing directory, it typically does nothing or throws an error if permissions are wrong.
    // The recursive: true option handles parent directories.
    await mkdir(uploadsDir, { recursive: true })

    console.log(`📁 [STYLING] Upload directory: ${uploadsDir}`)

    const settingsToSave: Record<string, string> = {}

    // Handle share icon uploads
    const shareIconFiles = ['facebook', 'twitter', 'linkedin', 'whatsapp', 'email']
    
    for (const platform of shareIconFiles) {
      const file = formData.get(`shareIcon${platform.charAt(0).toUpperCase() + platform.slice(1)}`) as File | null
      
      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ 
            error: `${platform} icon is too large. Maximum size is 1MB.` 
          }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filename = `share-${platform}-${Date.now()}-${file.name}`
        const filepath = join(uploadsDir, filename)
        
        await writeFile(filepath, buffer)
        await chmod(filepath, 0o644)
        
        // Store in shareIcons JSON
        const shareIconsStr = formData.get('shareIcons') || '{}'
        const shareIcons = JSON.parse(shareIconsStr as string)
        shareIcons[`${platform}Image`] = `/uploads/careers/${filename}`
        settingsToSave['careers_share_icons'] = JSON.stringify(shareIcons)
      }
    }

    // Custom styling settings
    const stylingSettings = [
      'customCss', 'jobDetailsButtonClass', 'jobDetailsButtonBg',
      'jobDetailsButtonText', 'jobDetailsButtonBorder', 'jobDetailsButtonBorderColor',
      'jobDetailsButtonRadius', 'jobDetailsButtonFontFamily', 'jobDetailsButtonFontSize',
      'jobDetailsButtonFontWeight', 'applyButtonClass', 'applyButtonBg',
      'applyButtonText', 'applyButtonBorder', 'applyButtonBorderColor',
      'applyButtonRadius', 'applyButtonFontFamily', 'applyButtonFontSize',
      'applyButtonFontWeight', 'shareIconsEnabled', 'shareIconWidth',
      'shareIconHeight', 'shareIconBorderRadius'
    ]

    stylingSettings.forEach(key => {
      const value = formData.get(key)
      if (value !== null) {
        const dbKey = `careers_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`
        settingsToSave[dbKey] = String(value)
      }
    })

    // Handle shareIcons JSON if not already set from uploads
    const shareIcons = formData.get('shareIcons')
    if (shareIcons && !settingsToSave['careers_share_icons']) {
      settingsToSave['careers_share_icons'] = String(shareIcons)
    }

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
      }

      if (toCreate.length > 0) {
        await tx.settings.createMany({ data: toCreate })
      }
    })

    console.log('✅ [STYLING] Settings saved successfully')
    return NextResponse.json({ success: true, message: 'Custom styling settings saved!' })

  } catch (error) {
    console.error('❌ [STYLING] Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save styling settings' 
    }, { status: 500 })
  }
}
