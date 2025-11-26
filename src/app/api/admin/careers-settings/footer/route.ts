import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

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

    // Handle JSON arrays
    const footerWidgets = formData.get('footerWidgets')
    if (footerWidgets) {
      settingsToSave['careers_footer_widgets'] = String(footerWidgets)
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
