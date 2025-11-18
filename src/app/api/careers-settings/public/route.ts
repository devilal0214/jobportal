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
            'careers_menu_items',
            'careers_nav_font_family',
            'careers_nav_font_size',
            'careers_nav_font_url',
            'careers_global_font_family',
            'careers_global_font_url',
            // Card settings
            'careers_card_container_radius',
            'careers_card_image_radius',
            'careers_card_padding',
            'careers_card_shadow',
            'careers_card_hover_lift',
            'careers_card_image_height',
            'careers_card_title_size',
            'careers_card_title_color',
            'careers_card_title_font_family',
            'careers_card_description_size',
            'careers_card_description_color',
            'careers_card_description_font_family',
            'careers_card_show_icons',
            'careers_card_grid_columns',
            // Button styling
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
            // Custom CSS
            'careers_custom_css',
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
            // Share icons
            'careers_share_icons_enabled',
            'careers_share_icons',
            'careers_share_icon_width',
            'careers_share_icon_height',
            'careers_share_icon_border_radius',
            // Filter visibility
            'careers_show_filters',
            'careers_show_search_filter',
            'careers_show_department_filter',
            'careers_show_experience_filter'
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
        case 'careers_nav_font_family':
          careersSettings.navFontFamily = setting.value
          break
        case 'careers_nav_font_size':
          careersSettings.navFontSize = setting.value
          break
        case 'careers_nav_font_url':
          careersSettings.navFontUrl = setting.value
          break
        case 'careers_global_font_family':
          careersSettings.globalFontFamily = setting.value
          break
        case 'careers_global_font_url':
          careersSettings.globalFontUrl = setting.value
          break
        // Card settings
        case 'careers_card_container_radius':
          careersSettings.cardContainerRadius = setting.value
          break
        case 'careers_card_image_radius':
          careersSettings.cardImageRadius = setting.value
          break
        case 'careers_card_padding':
          careersSettings.cardPadding = setting.value
          break
        case 'careers_card_shadow':
          careersSettings.cardShadow = setting.value
          break
        case 'careers_card_hover_lift':
          careersSettings.cardHoverLift = setting.value === 'true'
          break
        case 'careers_card_image_height':
          careersSettings.cardImageHeight = setting.value
          break
        case 'careers_card_title_size':
          careersSettings.cardTitleSize = setting.value
          break
        case 'careers_card_title_color':
          careersSettings.cardTitleColor = setting.value
          break
        case 'careers_card_title_font_family':
          careersSettings.cardTitleFontFamily = setting.value
          break
        case 'careers_card_description_size':
          careersSettings.cardDescriptionSize = setting.value
          break
        case 'careers_card_description_color':
          careersSettings.cardDescriptionColor = setting.value
          break
        case 'careers_card_description_font_family':
          careersSettings.cardDescriptionFontFamily = setting.value
          break
        case 'careers_card_show_icons':
          careersSettings.cardShowIcons = setting.value === 'true'
          break
        case 'careers_card_grid_columns':
          careersSettings.cardGridColumns = parseInt(setting.value) || 3
          break
        // Button styling - Card button
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
        // Job Details button
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
        // Apply button
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
        // Custom CSS
        case 'careers_custom_css':
          careersSettings.customCss = setting.value
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
        // Share icons
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
