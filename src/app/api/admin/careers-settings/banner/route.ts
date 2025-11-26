import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, chmod } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB

export async function POST(request: NextRequest) {
  console.log('🚀 [BANNER] Request started')
  
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
    
    // Detect public folder
    const isVPS = existsSync(join(process.cwd(), 'htdocs'))
    const publicFolderName = isVPS ? 'htdocs' : 'public'
    const uploadsDir = join(process.cwd(), publicFolderName, 'uploads', 'careers')
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    console.log(`📁 [BANNER] Upload directory: ${uploadsDir}`)

    const settingsToSave: Record<string, string> = {}

    // Handle banner image upload
    const bannerFile = formData.get('bannerImage') as File | null
    if (bannerFile && bannerFile.size > 0) {
      // Validate file size
      if (bannerFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `Banner file is too large (${(bannerFile.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 1MB.` 
        }, { status: 400 })
      }

      const bytes = await bannerFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `banner-${Date.now()}-${bannerFile.name}`
      const filepath = join(uploadsDir, filename)
      
      await writeFile(filepath, buffer)
      await chmod(filepath, 0o644)
      
      const publicPath = `/uploads/careers/${filename}`
      settingsToSave['careers_banner_image'] = publicPath
      console.log(`✅ [BANNER] Banner uploaded: ${filepath} -> ${publicPath}`)
    }

    // Add banner text settings
    const bannerSettings = [
      'bannerTitle', 'bannerSubtitle', 'bannerDescription',
      'bannerOverlay', 'bannerHeight', 'bannerWidth', 'bannerBorderRadius',
      'titleColor', 'titleFontSize', 'subtitleColor', 'subtitleFontSize',
      'descriptionColor', 'descriptionFontSize'
    ]

    bannerSettings.forEach(key => {
      const value = formData.get(key)
      if (value !== null) {
        const dbKey = `careers_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`
        settingsToSave[dbKey] = String(value)
      }
    })

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
      }

      if (toCreate.length > 0) {
        await tx.settings.createMany({ data: toCreate })
      }
    })

    console.log('✅ [BANNER] Settings saved successfully')
    return NextResponse.json({ success: true, message: 'Banner settings saved!' })

  } catch (error) {
    console.error('❌ [BANNER] Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save banner settings' 
    }, { status: 500 })
  }
}
