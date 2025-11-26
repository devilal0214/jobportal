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
  console.log('🚀 [LOGO] Request started')
  
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
    
    // Always use public folder for uploads (VPS uses parent htdocs but app uses public subfolder)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'careers')
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    console.log(`📁 [LOGO] Upload directory: ${uploadsDir}`)

    const settingsToSave: Record<string, string> = {}

    // Handle logo image upload
    const logoFile = formData.get('logoImage') as File | null
    if (logoFile && logoFile.size > 0) {
      // Validate file size
      if (logoFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `Logo file is too large (${(logoFile.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 1MB.` 
        }, { status: 400 })
      }

      const bytes = await logoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `logo-${Date.now()}-${logoFile.name}`
      const filepath = join(uploadsDir, filename)
      
      await writeFile(filepath, buffer)
      await chmod(filepath, 0o644)
      
      const publicPath = `/uploads/careers/${filename}`
      settingsToSave['careers_logo_image'] = publicPath
      console.log(`✅ [LOGO] Logo uploaded: ${filepath} -> ${publicPath}`)
    }

    // Handle nav font upload
    const navFontFile = formData.get('navFontFile') as File | null
    if (navFontFile && navFontFile.size > 0) {
      if (navFontFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `Nav font file is too large. Maximum size is 1MB.` 
        }, { status: 400 })
      }

      const bytes = await navFontFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `nav-font-${Date.now()}-${navFontFile.name}`
      const filepath = join(uploadsDir, filename)
      
      await writeFile(filepath, buffer)
      await chmod(filepath, 0o644)
      
      settingsToSave['careers_nav_font_url'] = `/uploads/careers/${filename}`
    }

    // Handle global font upload
    const globalFontFile = formData.get('globalFontFile') as File | null
    if (globalFontFile && globalFontFile.size > 0) {
      if (globalFontFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `Global font file is too large. Maximum size is 1MB.` 
        }, { status: 400 })
      }

      const bytes = await globalFontFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `global-font-${Date.now()}-${globalFontFile.name}`
      const filepath = join(uploadsDir, filename)
      
      await writeFile(filepath, buffer)
      await chmod(filepath, 0o644)
      
      settingsToSave['careers_global_font_url'] = `/uploads/careers/${filename}`
    }

    // Add text settings from formData
    const textSettings = [
      'logoHeight', 'logoWidth', 'companyName',
      'navFontFamily', 'navFontSize', 'globalFontFamily'
    ]

    textSettings.forEach(key => {
      const value = formData.get(key)
      if (value !== null) {
        const dbKey = `careers_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`
        settingsToSave[dbKey] = String(value)
      }
    })

    // Handle menu items (JSON)
    const menuItems = formData.get('menuItems')
    if (menuItems) {
      settingsToSave['careers_menu_items'] = String(menuItems)
    }

    // Save to database using transaction
    await prisma.$transaction(async (tx) => {
      // Fetch existing keys
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

      // Batch update existing
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

      // Batch create new
      if (toCreate.length > 0) {
        await tx.settings.createMany({ data: toCreate })
      }
    })

    console.log('✅ [LOGO] Settings saved successfully')
    return NextResponse.json({ success: true, message: 'Logo & Navigation settings saved!' })

  } catch (error) {
    console.error('❌ [LOGO] Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save logo settings' 
    }, { status: 500 })
  }
}
