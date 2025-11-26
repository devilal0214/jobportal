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
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('widgetLogo_')) {
        const widgetId = key.replace('widgetLogo_', '')
        const file = value as File
        
        if (file && file.size > 0) {
          // Validate size
          if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ 
              error: `Widget logo is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 1MB.` 
            }, { status: 400 })
          }

          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const filename = `widget-logo-${widgetId}-${Date.now()}.png`
          const filepath = join(uploadsDir, filename)
          
          await writeFile(filepath, buffer)
          await chmod(filepath, 0o644)
          
          const publicPath = `/uploads/careers/${filename}`
          widgetLogoMap[widgetId] = publicPath
          console.log(`✅ [FOOTER] Widget logo uploaded: ${filepath} -> ${publicPath}`)
        }
      }
    }

    // Handle footer widgets JSON and replace placeholders with uploaded file paths
    const footerWidgetsStr = formData.get('footerWidgets')
    if (footerWidgetsStr) {
      const widgets = JSON.parse(String(footerWidgetsStr))
      
      // Replace placeholder paths with actual uploaded file paths
      const updatedWidgets = widgets.map((widget: any) => {
        if (widget.logoImage && widget.logoImage.startsWith('WIDGET_LOGO_')) {
          const widgetId = widget.logoImage.replace('WIDGET_LOGO_', '')
          if (widgetLogoMap[widgetId]) {
            return { ...widget, logoImage: widgetLogoMap[widgetId] }
          }
        }
        return widget
      })
      
      settingsToSave['careers_footer_widgets'] = JSON.stringify(updatedWidgets)
      console.log(`✅ [FOOTER] Processed ${Object.keys(widgetLogoMap).length} widget logos`)
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
