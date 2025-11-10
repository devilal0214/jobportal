import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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

    // Transform settings into object with defaults
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
    return NextResponse.json({ 
      settings: {
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
    })
  }
}
