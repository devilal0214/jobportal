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
  console.log('🚀 [FOOTER] Request started')
  
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
    
    // Setup upload directory - always use public folder
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'careers')
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    console.log(`📁 [FOOTER] Upload directory: ${uploadsDir}`)
    
    const settingsToSave: Record<string, string> = {}

    // Footer settings
    const footerSettings = [
      'footerEnabled', 'footerColumns', 'footerWidth', 'footerBgColor',
      'footerTextColor', 'footerPadding', 'footerFontFamily', 'footerFontSize',
      'footerFontWeight', 'footerBorderTop', 'footerBorderBottom', 'footerBorderLeft',
      'footerBorderRight', 'footerBorderColor', 'copyrightEnabled', 'copyrightLeftHtml',
      'copyrightRightHtml', 'copyrightBgColor', 'copyrightTextColor',
      'copyrightDividerEnabled', 'copyrightDividerWidth', 'copyrightDividerHeight',
      'copyrightDividerColor', 'copyrightDividerBorderTop', 'copyrightDividerBorderBottom',
      'copyrightDividerBorderLeft', 'copyrightDividerBorderRight', 'copyrightDividerBorderStyle'
    ]

    footerSettings.forEach(key => {
      const value = formData.get(key)
      if (value !== null) {
        const dbKey = `careers_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`
        settingsToSave[dbKey] = String(value)
      }
    })

    // Handle widget logo uploads first
    const widgetLogoMap: Record<string, string> = {}
    
    console.log('🔍 [FOOTER] Checking FormData for widget logos...')
    let widgetLogoCount = 0
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('widgetLogo_')) {
        widgetLogoCount++
        const widgetId = key.replace('widgetLogo_', '')
        console.log(`   📷 [FOOTER] Found widget logo: key="${key}", widgetId="${widgetId}"`)
        
        const file = value as File
        console.log(`   📦 [FOOTER] File details: size=${file?.size || 0}, type=${file?.type || 'unknown'}`)
        
        if (file && file.size > 0) {
          // Validate size
          if (file.size > MAX_FILE_SIZE) {
            console.log(`   ❌ [FOOTER] File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
            return NextResponse.json({ 
              error: `Widget logo is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 1MB.` 
            }, { status: 400 })
          }

          // Validate file type - only allow png, jpg, jpeg, svg
          const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
          if (!allowedTypes.includes(file.type)) {
            console.log(`   ❌ [FOOTER] Invalid file type: ${file.type}`)
            return NextResponse.json({ 
              error: `Invalid file type. Only PNG, JPG, JPEG, and SVG images are allowed.` 
            }, { status: 400 })
          }

          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          
          // Determine file extension based on actual MIME type
          let ext = 'png'
          if (file.type === 'image/svg+xml') ext = 'svg'
          else if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = 'jpg'
          else if (file.type === 'image/webp') ext = 'webp'
          else if (file.type === 'image/gif') ext = 'gif'
          
          const filename = `widget-logo-${widgetId}-${Date.now()}.${ext}`
          const filepath = join(uploadsDir, filename)
          console.log(`   📝 [FOOTER] Using extension: .${ext} for MIME type: ${file.type}`)
          
          console.log(`   💾 [FOOTER] Writing file: ${filepath}`)
          await writeFile(filepath, buffer)
          await chmod(filepath, 0o644)
          
          const publicPath = `/uploads/careers/${filename}`
          widgetLogoMap[widgetId] = publicPath
          console.log(`   ✅ [FOOTER] Widget logo uploaded: ${filepath} -> ${publicPath}`)
        } else {
          console.log(`   ⚠️  [FOOTER] File is empty or invalid`)
        }
      }
    }
    
    console.log(`📊 [FOOTER] Total widget logo files found: ${widgetLogoCount}`)
    console.log(`📊 [FOOTER] Successfully uploaded: ${Object.keys(widgetLogoMap).length}`)
    if (Object.keys(widgetLogoMap).length > 0) {
      console.log(`📂 [FOOTER] Widget logo map:`, widgetLogoMap)
    }

    // Handle footer widgets JSON and replace placeholders with uploaded file paths
    const footerWidgetsStr = formData.get('footerWidgets')
    if (footerWidgetsStr) {
      const widgets = JSON.parse(String(footerWidgetsStr))
      console.log(`🔍 [FOOTER] Processing ${widgets.length} widgets...`)
      
      // Replace placeholder paths with actual uploaded file paths
      const updatedWidgets = widgets.map((widget: any, index: number) => {
        console.log(`   Widget ${index + 1}: type="${widget.type}", id="${widget.id}"`)
        
        if (widget.logoImage) {
          console.log(`      logoImage: "${widget.logoImage.substring(0, 50)}${widget.logoImage.length > 50 ? '...' : ''}"`)
          
          if (widget.logoImage.startsWith('WIDGET_LOGO_')) {
            const widgetId = widget.logoImage.replace('WIDGET_LOGO_', '')
            console.log(`      🔑 Found placeholder! Widget ID: "${widgetId}"`)
            
            if (widgetLogoMap[widgetId]) {
              console.log(`      ✅ Replacing with: "${widgetLogoMap[widgetId]}"`)
              return { ...widget, logoImage: widgetLogoMap[widgetId] }
            } else {
              console.log(`      ❌ No uploaded file found for widget ID: "${widgetId}"`)
              console.log(`      Available IDs in map:`, Object.keys(widgetLogoMap))
            }
          } else if (widget.logoImage.startsWith('data:')) {
            console.log(`      ⚠️  Widget still has base64 data! This should have been extracted by frontend.`)
          } else {
            console.log(`      ✓ Already has valid path, keeping as-is`)
          }
        } else {
          console.log(`      ℹ️  No logoImage field`)
        }
        
        return widget
      })
      
      settingsToSave['careers_footer_widgets'] = JSON.stringify(updatedWidgets)
      console.log(`✅ [FOOTER] Processed ${Object.keys(widgetLogoMap).length} widget logos`)
      console.log(`📝 [FOOTER] Final widget data (first 200 chars):`, JSON.stringify(updatedWidgets).substring(0, 200))
    }

    const socialLinks = formData.get('socialLinks')
    if (socialLinks) {
      settingsToSave['careers_social_links'] = String(socialLinks)
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

    console.log('✅ [FOOTER] Settings saved successfully')
    return NextResponse.json({ success: true, message: 'Footer settings saved!' })

  } catch (error) {
    console.error('❌ [FOOTER] Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save footer settings' 
    }, { status: 500 })
  }
}
