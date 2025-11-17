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
            'careers_menu_items',
            // Footer settings
            'careers_footer_enabled',
            'careers_footer_columns',
            'careers_footer_width',
            'careers_footer_widgets',
            'careers_footer_bg_color',
            'careers_footer_text_color',
            'careers_footer_padding',
            'careers_footer_font_family',
            'careers_footer_font_size',
            'careers_footer_font_weight',
            'careers_footer_border_top',
            'careers_footer_border_bottom',
            'careers_footer_border_left',
            'careers_footer_border_right',
            'careers_footer_border_color',
            'careers_copyright_enabled',
            'careers_copyright_left_html',
            'careers_copyright_right_html',
            'careers_copyright_bg_color',
            'careers_copyright_text_color',
            'careers_copyright_divider_enabled',
            'careers_copyright_divider_width',
            'careers_copyright_divider_height',
            'careers_copyright_divider_color',
            'careers_copyright_divider_border_top',
            'careers_copyright_divider_border_bottom',
            'careers_copyright_divider_border_left',
            'careers_copyright_divider_border_right',
            'careers_copyright_divider_border_style',
            'careers_social_links',
            // Custom styling
            'careers_custom_css',
            'careers_card_button_class',
            'careers_card_button_bg',
            'careers_card_button_text',
            'careers_card_button_border',
            'careers_card_button_border_color',
            'careers_card_button_radius',
            'careers_card_button_font_family',
            'careers_card_button_font_size',
            'careers_card_button_font_weight',
            'careers_card_button_label',
            'careers_job_details_button_class',
            'careers_job_details_button_bg',
            'careers_job_details_button_text',
            'careers_job_details_button_border',
            'careers_job_details_button_border_color',
            'careers_job_details_button_radius',
            'careers_job_details_button_font_family',
            'careers_job_details_button_font_size',
            'careers_job_details_button_font_weight',
            'careers_apply_button_class',
            'careers_apply_button_bg',
            'careers_apply_button_text',
            'careers_apply_button_border',
            'careers_apply_button_border_color',
            'careers_apply_button_radius',
            'careers_apply_button_font_family',
            'careers_apply_button_font_size',
            'careers_apply_button_font_weight',
            'careers_share_icons_enabled',
            'careers_share_icons',
            'careers_share_icon_width',
            'careers_share_icon_height',
            'careers_share_icon_border_radius',
            // Page layout
            'careers_page_layout',
            'careers_page_max_width',
            // Filter visibility
            'careers_show_filters',
            'careers_show_search_filter',
            'careers_show_department_filter',
            'careers_show_experience_filter'
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
        // Footer settings
        case 'careers_footer_enabled':
          careersSettings.footerEnabled = setting.value === 'true'
          break
        case 'careers_footer_columns':
          careersSettings.footerColumns = parseInt(setting.value) || 4
          break
        case 'careers_footer_width':
          careersSettings.footerWidth = setting.value
          break
        case 'careers_footer_widgets':
          try {
            careersSettings.footerWidgets = JSON.parse(setting.value)
          } catch {
            careersSettings.footerWidgets = []
          }
          break
        case 'careers_footer_bg_color':
          careersSettings.footerBgColor = setting.value
          break
        case 'careers_footer_text_color':
          careersSettings.footerTextColor = setting.value
          break
        case 'careers_footer_padding':
          careersSettings.footerPadding = setting.value
          break
        case 'careers_footer_font_family':
          careersSettings.footerFontFamily = setting.value
          break
        case 'careers_footer_font_size':
          careersSettings.footerFontSize = setting.value
          break
        case 'careers_footer_font_weight':
          careersSettings.footerFontWeight = setting.value
          break
        case 'careers_footer_border_top':
          careersSettings.footerBorderTop = setting.value
          break
        case 'careers_footer_border_bottom':
          careersSettings.footerBorderBottom = setting.value
          break
        case 'careers_footer_border_left':
          careersSettings.footerBorderLeft = setting.value
          break
        case 'careers_footer_border_right':
          careersSettings.footerBorderRight = setting.value
          break
        case 'careers_footer_border_color':
          careersSettings.footerBorderColor = setting.value
          break
        case 'careers_copyright_enabled':
          careersSettings.copyrightEnabled = setting.value === 'true'
          break
        case 'careers_copyright_left_html':
          careersSettings.copyrightLeftHtml = setting.value
          break
        case 'careers_copyright_right_html':
          careersSettings.copyrightRightHtml = setting.value
          break
        case 'careers_copyright_bg_color':
          careersSettings.copyrightBgColor = setting.value
          break
        case 'careers_copyright_text_color':
          careersSettings.copyrightTextColor = setting.value
          break
        case 'careers_copyright_divider_enabled':
          careersSettings.copyrightDividerEnabled = setting.value === 'true'
          break
        case 'careers_copyright_divider_width':
          careersSettings.copyrightDividerWidth = setting.value
          break
        case 'careers_copyright_divider_height':
          careersSettings.copyrightDividerHeight = setting.value
          break
        case 'careers_copyright_divider_color':
          careersSettings.copyrightDividerColor = setting.value
          break
        case 'careers_copyright_divider_border_top':
          careersSettings.copyrightDividerBorderTop = setting.value
          break
        case 'careers_copyright_divider_border_bottom':
          careersSettings.copyrightDividerBorderBottom = setting.value
          break
        case 'careers_copyright_divider_border_left':
          careersSettings.copyrightDividerBorderLeft = setting.value
          break
        case 'careers_copyright_divider_border_right':
          careersSettings.copyrightDividerBorderRight = setting.value
          break
        case 'careers_copyright_divider_border_style':
          careersSettings.copyrightDividerBorderStyle = setting.value
          break
        case 'careers_social_links':
          try {
            careersSettings.socialLinks = JSON.parse(setting.value)
          } catch {
            careersSettings.socialLinks = []
          }
          break
        // Custom styling
        case 'careers_custom_css':
          careersSettings.customCss = setting.value
          break
        case 'careers_card_button_class':
          careersSettings.cardButtonClass = setting.value
          break
        case 'careers_card_button_bg':
          careersSettings.cardButtonBg = setting.value
          break
        case 'careers_card_button_text':
          careersSettings.cardButtonText = setting.value
          break
        case 'careers_card_button_border':
          careersSettings.cardButtonBorder = setting.value
          break
        case 'careers_card_button_border_color':
          careersSettings.cardButtonBorderColor = setting.value
          break
        case 'careers_card_button_radius':
          careersSettings.cardButtonRadius = setting.value
          break
        case 'careers_card_button_font_family':
          careersSettings.cardButtonFontFamily = setting.value
          break
        case 'careers_card_button_font_size':
          careersSettings.cardButtonFontSize = setting.value
          break
        case 'careers_card_button_font_weight':
          careersSettings.cardButtonFontWeight = setting.value
          break
        case 'careers_card_button_label':
          careersSettings.cardButtonLabel = setting.value
          break
        case 'careers_job_details_button_class':
          careersSettings.jobDetailsButtonClass = setting.value
          break
        case 'careers_job_details_button_bg':
          careersSettings.jobDetailsButtonBg = setting.value
          break
        case 'careers_job_details_button_text':
          careersSettings.jobDetailsButtonText = setting.value
          break
        case 'careers_job_details_button_border':
          careersSettings.jobDetailsButtonBorder = setting.value
          break
        case 'careers_job_details_button_border_color':
          careersSettings.jobDetailsButtonBorderColor = setting.value
          break
        case 'careers_job_details_button_radius':
          careersSettings.jobDetailsButtonRadius = setting.value
          break
        case 'careers_job_details_button_font_family':
          careersSettings.jobDetailsButtonFontFamily = setting.value
          break
        case 'careers_job_details_button_font_size':
          careersSettings.jobDetailsButtonFontSize = setting.value
          break
        case 'careers_job_details_button_font_weight':
          careersSettings.jobDetailsButtonFontWeight = setting.value
          break
        case 'careers_apply_button_class':
          careersSettings.applyButtonClass = setting.value
          break
        case 'careers_apply_button_bg':
          careersSettings.applyButtonBg = setting.value
          break
        case 'careers_apply_button_text':
          careersSettings.applyButtonText = setting.value
          break
        case 'careers_apply_button_border':
          careersSettings.applyButtonBorder = setting.value
          break
        case 'careers_apply_button_border_color':
          careersSettings.applyButtonBorderColor = setting.value
          break
        case 'careers_apply_button_radius':
          careersSettings.applyButtonRadius = setting.value
          break
        case 'careers_apply_button_font_family':
          careersSettings.applyButtonFontFamily = setting.value
          break
        case 'careers_apply_button_font_size':
          careersSettings.applyButtonFontSize = setting.value
          break
        case 'careers_apply_button_font_weight':
          careersSettings.applyButtonFontWeight = setting.value
          break
        case 'careers_share_icons_enabled':
          careersSettings.shareIconsEnabled = setting.value === 'true'
          break
        case 'careers_share_icons':
          try {
            careersSettings.shareIcons = JSON.parse(setting.value)
          } catch {
            careersSettings.shareIcons = {}
          }
          break
        case 'careers_share_icon_width':
          careersSettings.shareIconWidth = setting.value
          break
        case 'careers_share_icon_height':
          careersSettings.shareIconHeight = setting.value
          break
        case 'careers_share_icon_border_radius':
          careersSettings.shareIconBorderRadius = setting.value
          break
        // Page layout
        case 'careers_page_layout':
          careersSettings.pageLayout = setting.value
          break
        case 'careers_page_max_width':
          careersSettings.pageMaxWidth = setting.value
          break
        // Filter visibility
        case 'careers_show_filters':
          careersSettings.showFilters = setting.value === 'true'
          break
        case 'careers_show_search_filter':
          careersSettings.showSearchFilter = setting.value === 'true'
          break
        case 'careers_show_department_filter':
          careersSettings.showDepartmentFilter = setting.value === 'true'
          break
        case 'careers_show_experience_filter':
          careersSettings.showExperienceFilter = setting.value === 'true'
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
    
    // Footer settings
    const footerEnabled = formData.get('footerEnabled') as string
    const footerColumns = formData.get('footerColumns') as string
    const footerWidth = formData.get('footerWidth') as string
    const footerWidgets = formData.get('footerWidgets') as string
    const footerBgColor = formData.get('footerBgColor') as string
    const footerTextColor = formData.get('footerTextColor') as string
    const footerPadding = formData.get('footerPadding') as string
    const footerFontFamily = formData.get('footerFontFamily') as string
    const footerFontSize = formData.get('footerFontSize') as string
    const footerFontWeight = formData.get('footerFontWeight') as string
    const footerBorderTop = formData.get('footerBorderTop') as string
    const footerBorderBottom = formData.get('footerBorderBottom') as string
    const footerBorderLeft = formData.get('footerBorderLeft') as string
    const footerBorderRight = formData.get('footerBorderRight') as string
    const footerBorderColor = formData.get('footerBorderColor') as string
    const copyrightEnabled = formData.get('copyrightEnabled') as string
    const copyrightLeftHtml = formData.get('copyrightLeftHtml') as string
    const copyrightRightHtml = formData.get('copyrightRightHtml') as string
    const copyrightBgColor = formData.get('copyrightBgColor') as string
    const copyrightTextColor = formData.get('copyrightTextColor') as string
    const copyrightDividerEnabled = formData.get('copyrightDividerEnabled') as string
    const copyrightDividerWidth = formData.get('copyrightDividerWidth') as string
    const copyrightDividerHeight = formData.get('copyrightDividerHeight') as string
    const copyrightDividerColor = formData.get('copyrightDividerColor') as string
    const copyrightDividerBorderTop = formData.get('copyrightDividerBorderTop') as string
    const copyrightDividerBorderBottom = formData.get('copyrightDividerBorderBottom') as string
    const copyrightDividerBorderLeft = formData.get('copyrightDividerBorderLeft') as string
    const copyrightDividerBorderRight = formData.get('copyrightDividerBorderRight') as string
    const copyrightDividerBorderStyle = formData.get('copyrightDividerBorderStyle') as string
    const socialLinks = formData.get('socialLinks') as string
    
    // Custom styling
    const customCss = formData.get('customCss') as string
    const cardButtonClass = formData.get('cardButtonClass') as string
    const cardButtonBg = formData.get('cardButtonBg') as string
    const cardButtonText = formData.get('cardButtonText') as string
    const cardButtonBorder = formData.get('cardButtonBorder') as string
    const cardButtonBorderColor = formData.get('cardButtonBorderColor') as string
    const cardButtonRadius = formData.get('cardButtonRadius') as string
    const cardButtonFontFamily = formData.get('cardButtonFontFamily') as string
    const cardButtonFontSize = formData.get('cardButtonFontSize') as string
    const cardButtonFontWeight = formData.get('cardButtonFontWeight') as string
    const cardButtonLabel = formData.get('cardButtonLabel') as string
    const jobDetailsButtonClass = formData.get('jobDetailsButtonClass') as string
    const jobDetailsButtonBg = formData.get('jobDetailsButtonBg') as string
    const jobDetailsButtonText = formData.get('jobDetailsButtonText') as string
    const jobDetailsButtonBorder = formData.get('jobDetailsButtonBorder') as string
    const jobDetailsButtonBorderColor = formData.get('jobDetailsButtonBorderColor') as string
    const jobDetailsButtonRadius = formData.get('jobDetailsButtonRadius') as string
    const jobDetailsButtonFontFamily = formData.get('jobDetailsButtonFontFamily') as string
    const jobDetailsButtonFontSize = formData.get('jobDetailsButtonFontSize') as string
    const jobDetailsButtonFontWeight = formData.get('jobDetailsButtonFontWeight') as string
    const applyButtonClass = formData.get('applyButtonClass') as string
    const applyButtonBg = formData.get('applyButtonBg') as string
    const applyButtonText = formData.get('applyButtonText') as string
    const applyButtonBorder = formData.get('applyButtonBorder') as string
    const applyButtonBorderColor = formData.get('applyButtonBorderColor') as string
    const applyButtonRadius = formData.get('applyButtonRadius') as string
    const applyButtonFontFamily = formData.get('applyButtonFontFamily') as string
    const applyButtonFontSize = formData.get('applyButtonFontSize') as string
    const applyButtonFontWeight = formData.get('applyButtonFontWeight') as string
    const shareIconsEnabled = formData.get('shareIconsEnabled') as string
    const shareIcons = formData.get('shareIcons') as string
    const shareIconWidth = formData.get('shareIconWidth') as string
    const shareIconHeight = formData.get('shareIconHeight') as string
    const shareIconBorderRadius = formData.get('shareIconBorderRadius') as string
    
    // Page layout
    const pageLayout = formData.get('pageLayout') as string
    const pageMaxWidth = formData.get('pageMaxWidth') as string
    
    // Filter visibility
    const showFilters = formData.get('showFilters') as string
    const showSearchFilter = formData.get('showSearchFilter') as string
    const showDepartmentFilter = formData.get('showDepartmentFilter') as string
    const showExperienceFilter = formData.get('showExperienceFilter') as string
    
    const bannerImageFile = formData.get('bannerImage') as File | null
    const logoImageFile = formData.get('logoImage') as File | null
    const shareIconFacebookFile = formData.get('shareIconFacebook') as File | null
    const shareIconTwitterFile = formData.get('shareIconTwitter') as File | null
    const shareIconLinkedinFile = formData.get('shareIconLinkedin') as File | null
    const shareIconWhatsappFile = formData.get('shareIconWhatsapp') as File | null
    const shareIconEmailFile = formData.get('shareIconEmail') as File | null

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

    // Handle share icon uploads and update shareIcons object
    let shareIconsObj: Record<string, string> = {}
    try {
      shareIconsObj = shareIcons ? JSON.parse(shareIcons) : {}
    } catch {
      shareIconsObj = {}
    }

    if (shareIconFacebookFile && shareIconFacebookFile.size > 0) {
      const bytes = await shareIconFacebookFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `share-facebook-${Date.now()}-${shareIconFacebookFile.name}`
      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, buffer)
      shareIconsObj.facebookImage = `/uploads/careers/${fileName}`
    }

    if (shareIconTwitterFile && shareIconTwitterFile.size > 0) {
      const bytes = await shareIconTwitterFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `share-twitter-${Date.now()}-${shareIconTwitterFile.name}`
      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, buffer)
      shareIconsObj.twitterImage = `/uploads/careers/${fileName}`
    }

    if (shareIconLinkedinFile && shareIconLinkedinFile.size > 0) {
      const bytes = await shareIconLinkedinFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `share-linkedin-${Date.now()}-${shareIconLinkedinFile.name}`
      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, buffer)
      shareIconsObj.linkedinImage = `/uploads/careers/${fileName}`
    }

    if (shareIconWhatsappFile && shareIconWhatsappFile.size > 0) {
      const bytes = await shareIconWhatsappFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `share-whatsapp-${Date.now()}-${shareIconWhatsappFile.name}`
      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, buffer)
      shareIconsObj.whatsappImage = `/uploads/careers/${fileName}`
    }

    if (shareIconEmailFile && shareIconEmailFile.size > 0) {
      const bytes = await shareIconEmailFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `share-email-${Date.now()}-${shareIconEmailFile.name}`
      const filePath = join(uploadsDir, fileName)
      await writeFile(filePath, buffer)
      shareIconsObj.emailImage = `/uploads/careers/${fileName}`
    }

    // Update shareIcons value with uploaded images
    const finalShareIcons = JSON.stringify(shareIconsObj)
    console.log("Share Icons Object to save:", shareIconsObj)
    console.log("Final Share Icons JSON:", finalShareIcons)

    // Update settings in database
    const settingsToUpdate = [
      { key: 'careers_banner_title', value: bannerTitle || '' },
      { key: 'careers_banner_subtitle', value: bannerSubtitle || '' },
      { key: 'careers_banner_description', value: bannerDescription || '' },
      { key: 'careers_banner_overlay', value: bannerOverlay || '' },
      { key: 'careers_banner_height', value: bannerHeight || '' },
      { key: 'careers_banner_width', value: bannerWidth || '' },
      { key: 'careers_banner_border_radius', value: bannerBorderRadius || '' },
      { key: 'careers_title_color', value: titleColor || '' },
      { key: 'careers_title_font_size', value: titleFontSize || '' },
      { key: 'careers_subtitle_color', value: subtitleColor || '' },
      { key: 'careers_subtitle_font_size', value: subtitleFontSize || '' },
      { key: 'careers_description_color', value: descriptionColor || '' },
      { key: 'careers_description_font_size', value: descriptionFontSize || '' },
      { key: 'careers_logo_height', value: logoHeight || '' },
      { key: 'careers_logo_width', value: logoWidth || '' },
      { key: 'careers_company_name', value: companyName || '' },
      { key: 'careers_menu_items', value: menuItems || '[]' },
      // Footer settings
      { key: 'careers_footer_enabled', value: footerEnabled || 'false' },
      { key: 'careers_footer_columns', value: footerColumns || '4' },
      { key: 'careers_footer_width', value: footerWidth || '1280px' },
      { key: 'careers_footer_widgets', value: footerWidgets || '[]' },
      { key: 'careers_footer_bg_color', value: footerBgColor || '#1f2937' },
      { key: 'careers_footer_text_color', value: footerTextColor || '#f3f4f6' },
      { key: 'careers_footer_padding', value: footerPadding || '48px' },
      { key: 'careers_footer_font_family', value: footerFontFamily || 'System Default' },
      { key: 'careers_footer_font_size', value: footerFontSize || '14px' },
      { key: 'careers_footer_font_weight', value: footerFontWeight || '400' },
      { key: 'careers_footer_border_top', value: footerBorderTop || '0px' },
      { key: 'careers_footer_border_bottom', value: footerBorderBottom || '0px' },
      { key: 'careers_footer_border_left', value: footerBorderLeft || '0px' },
      { key: 'careers_footer_border_right', value: footerBorderRight || '0px' },
      { key: 'careers_footer_border_color', value: footerBorderColor || '#374151' },
      { key: 'careers_copyright_enabled', value: copyrightEnabled || 'false' },
      { key: 'careers_copyright_left_html', value: copyrightLeftHtml || '' },
      { key: 'careers_copyright_right_html', value: copyrightRightHtml || '' },
      { key: 'careers_copyright_bg_color', value: copyrightBgColor || '#111827' },
      { key: 'careers_copyright_text_color', value: copyrightTextColor || '#9ca3af' },
      { key: 'careers_copyright_divider_enabled', value: copyrightDividerEnabled || 'false' },
      { key: 'careers_copyright_divider_width', value: copyrightDividerWidth || '100%' },
      { key: 'careers_copyright_divider_height', value: copyrightDividerHeight || '1px' },
      { key: 'careers_copyright_divider_color', value: copyrightDividerColor || '#374151' },
      { key: 'careers_copyright_divider_border_top', value: copyrightDividerBorderTop || '1px' },
      { key: 'careers_copyright_divider_border_bottom', value: copyrightDividerBorderBottom || '0px' },
      { key: 'careers_copyright_divider_border_left', value: copyrightDividerBorderLeft || '0px' },
      { key: 'careers_copyright_divider_border_right', value: copyrightDividerBorderRight || '0px' },
      { key: 'careers_copyright_divider_border_style', value: copyrightDividerBorderStyle || 'solid' },
      { key: 'careers_social_links', value: socialLinks || '[]' },
      // Custom styling
      { key: 'careers_custom_css', value: customCss || '' },
      { key: 'careers_card_button_class', value: cardButtonClass || '' },
      { key: 'careers_card_button_bg', value: cardButtonBg || '#4f46e5' },
      { key: 'careers_card_button_text', value: cardButtonText || '#ffffff' },
      { key: 'careers_card_button_border', value: cardButtonBorder || '0px' },
      { key: 'careers_card_button_border_color', value: cardButtonBorderColor || '#4f46e5' },
      { key: 'careers_card_button_radius', value: cardButtonRadius || '8px' },
      { key: 'careers_card_button_font_family', value: cardButtonFontFamily || 'System Default' },
      { key: 'careers_card_button_font_size', value: cardButtonFontSize || '14px' },
      { key: 'careers_card_button_font_weight', value: cardButtonFontWeight || '500' },
      { key: 'careers_card_button_label', value: cardButtonLabel || 'Know More' },
      { key: 'careers_job_details_button_class', value: jobDetailsButtonClass || '' },
      { key: 'careers_job_details_button_bg', value: jobDetailsButtonBg || '#4f46e5' },
      { key: 'careers_job_details_button_text', value: jobDetailsButtonText || '#ffffff' },
      { key: 'careers_job_details_button_border', value: jobDetailsButtonBorder || '0px' },
      { key: 'careers_job_details_button_border_color', value: jobDetailsButtonBorderColor || '#4f46e5' },
      { key: 'careers_job_details_button_radius', value: jobDetailsButtonRadius || '8px' },
      { key: 'careers_job_details_button_font_family', value: jobDetailsButtonFontFamily || 'System Default' },
      { key: 'careers_job_details_button_font_size', value: jobDetailsButtonFontSize || '14px' },
      { key: 'careers_job_details_button_font_weight', value: jobDetailsButtonFontWeight || '500' },
      { key: 'careers_apply_button_class', value: applyButtonClass || '' },
      { key: 'careers_apply_button_bg', value: applyButtonBg || '#10b981' },
      { key: 'careers_apply_button_text', value: applyButtonText || '#ffffff' },
      { key: 'careers_apply_button_border', value: applyButtonBorder || '0px' },
      { key: 'careers_apply_button_border_color', value: applyButtonBorderColor || '#10b981' },
      { key: 'careers_apply_button_radius', value: applyButtonRadius || '8px' },
      { key: 'careers_apply_button_font_family', value: applyButtonFontFamily || 'System Default' },
      { key: 'careers_apply_button_font_size', value: applyButtonFontSize || '14px' },
      { key: 'careers_apply_button_font_weight', value: applyButtonFontWeight || '500' },
      { key: 'careers_share_icons_enabled', value: shareIconsEnabled || 'false' },
      { key: 'careers_share_icons', value: finalShareIcons || '{}' },
      { key: 'careers_share_icon_width', value: shareIconWidth || '32px' },
      { key: 'careers_share_icon_height', value: shareIconHeight || '32px' },
      { key: 'careers_share_icon_border_radius', value: shareIconBorderRadius || '6px' },
      // Page layout
      { key: 'careers_page_layout', value: pageLayout || 'grid' },
      { key: 'careers_page_max_width', value: pageMaxWidth || '1280px' },
      // Filter visibility
      { key: 'careers_show_filters', value: showFilters || 'true' },
      { key: 'careers_show_search_filter', value: showSearchFilter || 'true' },
      { key: 'careers_show_department_filter', value: showDepartmentFilter || 'true' },
      { key: 'careers_show_experience_filter', value: showExperienceFilter || 'true' }
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
