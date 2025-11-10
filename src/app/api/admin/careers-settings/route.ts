import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(request: NextRequest) {
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

    // Fetch all settings related to careers page
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: [
            'careers_banner_image',
            'careers_banner_title',
            'careers_banner_subtitle',
            'careers_banner_description',
            'careers_banner_overlay',
            'careers_banner_height',
            'careers_banner_width',
            'careers_banner_border_radius',
            'careers_title_color',
            'careers_title_font_size',
            'careers_subtitle_color',
            'careers_subtitle_font_size',
            'careers_description_color',
            'careers_description_font_size',
            'careers_logo_image',
            'careers_logo_height',
            'careers_logo_width',
            'careers_company_name',
            'careers_menu_items'
          ]
        }
      }
    })

    // Transform settings into object
    const careersSettings: Record<string, unknown> = {
      bannerTitle: 'Careers at JV',
      bannerSubtitle: 'Explore Our Job Openings and Start Your Exciting Career with Us',
      bannerDescription: 'We are a fast-growing creative marketing agency looking for talented and passionate individuals to join our team.',
      bannerOverlay: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
      bannerHeight: '400px',
      bannerWidth: '100%',
      bannerBorderRadius: '0px',
      titleColor: '#ffffff',
      titleFontSize: '48px',
      subtitleColor: '#ffffff',
      subtitleFontSize: '24px',
      descriptionColor: '#f3f4f6',
      descriptionFontSize: '16px',
      logoHeight: '40px',
      logoWidth: '40px',
      companyName: 'Job Portal',
      menuItems: []
    }

    settings.forEach(setting => {
      switch (setting.key) {
        case 'careers_banner_image':
          careersSettings.bannerImage = setting.value
          break
        case 'careers_banner_title':
          careersSettings.bannerTitle = setting.value
          break
        case 'careers_banner_subtitle':
          careersSettings.bannerSubtitle = setting.value
          break
        case 'careers_banner_description':
          careersSettings.bannerDescription = setting.value
          break
        case 'careers_banner_overlay':
          careersSettings.bannerOverlay = setting.value
          break
        case 'careers_banner_height':
          careersSettings.bannerHeight = setting.value
          break
        case 'careers_banner_width':
          careersSettings.bannerWidth = setting.value
          break
        case 'careers_banner_border_radius':
          careersSettings.bannerBorderRadius = setting.value
          break
        case 'careers_title_color':
          careersSettings.titleColor = setting.value
          break
        case 'careers_title_font_size':
          careersSettings.titleFontSize = setting.value
          break
        case 'careers_subtitle_color':
          careersSettings.subtitleColor = setting.value
          break
        case 'careers_subtitle_font_size':
          careersSettings.subtitleFontSize = setting.value
          break
        case 'careers_description_color':
          careersSettings.descriptionColor = setting.value
          break
        case 'careers_description_font_size':
          careersSettings.descriptionFontSize = setting.value
          break
        case 'careers_logo_image':
          careersSettings.logoImage = setting.value
          break
        case 'careers_logo_height':
          careersSettings.logoHeight = setting.value
          break
        case 'careers_logo_width':
          careersSettings.logoWidth = setting.value
          break
        case 'careers_company_name':
          careersSettings.companyName = setting.value
          break
        case 'careers_menu_items':
          try {
            careersSettings.menuItems = JSON.parse(setting.value)
          } catch {
            careersSettings.menuItems = []
          }
          break
      }
    })

    return NextResponse.json({ settings: careersSettings })
  } catch (error) {
    console.error('Careers settings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    
    const bannerTitle = formData.get('bannerTitle') as string
    const bannerSubtitle = formData.get('bannerSubtitle') as string
    const bannerDescription = formData.get('bannerDescription') as string
    const bannerOverlay = formData.get('bannerOverlay') as string
    const bannerHeight = formData.get('bannerHeight') as string
    const bannerWidth = formData.get('bannerWidth') as string
    const bannerBorderRadius = formData.get('bannerBorderRadius') as string
    const titleColor = formData.get('titleColor') as string
    const titleFontSize = formData.get('titleFontSize') as string
    const subtitleColor = formData.get('subtitleColor') as string
    const subtitleFontSize = formData.get('subtitleFontSize') as string
    const descriptionColor = formData.get('descriptionColor') as string
    const descriptionFontSize = formData.get('descriptionFontSize') as string
    const logoHeight = formData.get('logoHeight') as string
    const logoWidth = formData.get('logoWidth') as string
    const companyName = formData.get('companyName') as string
    const menuItems = formData.get('menuItems') as string
    
    const bannerImageFile = formData.get('bannerImage') as File | null
    const logoImageFile = formData.get('logoImage') as File | null

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'careers')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    let bannerImagePath = null
    let logoImagePath = null

    // Handle banner image upload
    if (bannerImageFile && bannerImageFile.size > 0) {
      const bytes = await bannerImageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `banner-${Date.now()}-${bannerImageFile.name}`
      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, buffer)
      bannerImagePath = `/uploads/careers/${fileName}`
    }

    // Handle logo image upload
    if (logoImageFile && logoImageFile.size > 0) {
      const bytes = await logoImageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `logo-${Date.now()}-${logoImageFile.name}`
      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, buffer)
      logoImagePath = `/uploads/careers/${fileName}`
    }

    // Update settings in database
    const settingsToUpdate = [
      { key: 'careers_banner_title', value: bannerTitle },
      { key: 'careers_banner_subtitle', value: bannerSubtitle },
      { key: 'careers_banner_description', value: bannerDescription },
      { key: 'careers_banner_overlay', value: bannerOverlay },
      { key: 'careers_banner_height', value: bannerHeight },
      { key: 'careers_banner_width', value: bannerWidth },
      { key: 'careers_banner_border_radius', value: bannerBorderRadius },
      { key: 'careers_title_color', value: titleColor },
      { key: 'careers_title_font_size', value: titleFontSize },
      { key: 'careers_subtitle_color', value: subtitleColor },
      { key: 'careers_subtitle_font_size', value: subtitleFontSize },
      { key: 'careers_description_color', value: descriptionColor },
      { key: 'careers_description_font_size', value: descriptionFontSize },
      { key: 'careers_logo_height', value: logoHeight },
      { key: 'careers_logo_width', value: logoWidth },
      { key: 'careers_company_name', value: companyName },
      { key: 'careers_menu_items', value: menuItems }
    ]

    if (bannerImagePath) {
      settingsToUpdate.push({ key: 'careers_banner_image', value: bannerImagePath })
    }

    if (logoImagePath) {
      settingsToUpdate.push({ key: 'careers_logo_image', value: logoImagePath })
    }

    // Upsert each setting
    for (const setting of settingsToUpdate) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: {
          key: setting.key,
          value: setting.value,
          type: 'text'
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully' 
    })
  } catch (error) {
    console.error('Careers settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
