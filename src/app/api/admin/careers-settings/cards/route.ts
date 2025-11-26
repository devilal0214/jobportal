import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('🚀 [CARDS] Request started')
  
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
    
    const settingsToSave: Record<string, string> = {}

    // Card settings (no files, just text/numbers/booleans)
    const cardSettings = [
      'cardContainerRadius', 'cardImageRadius', 'cardPadding', 'cardShadow',
      'cardHoverLift', 'cardImageHeight', 'cardTitleSize', 'cardTitleColor',
      'cardTitleFontFamily', 'cardDescriptionSize', 'cardDescriptionColor',
      'cardDescriptionFontFamily', 'cardShowIcons', 'cardButtonBg',
      'cardButtonText', 'cardButtonLabel', 'cardButtonClass', 'cardButtonBorder',
      'cardButtonBorderColor', 'cardButtonRadius', 'cardButtonFontFamily',
      'cardButtonFontSize', 'cardButtonFontWeight', 'cardGridColumns',
      'pageLayout', 'pageMaxWidth', 'showFilters', 'showSearchFilter',
      'showDepartmentFilter', 'showExperienceFilter'
    ]

    cardSettings.forEach(key => {
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

    console.log('✅ [CARDS] Settings saved successfully')
    return NextResponse.json({ success: true, message: 'Job card settings saved!' })

  } catch (error) {
    console.error('❌ [CARDS] Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save card settings' 
    }, { status: 500 })
  }
}
