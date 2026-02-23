'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { useRouter } from 'next/navigation'
import BrandButton from '@/components/BrandButton'
import { 
  Briefcase,
  Facebook,
  Linkedin,
  Mail
} from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  position: string
  department: string
  location: string
  salary: string
  experienceLevel: string
  status: string
  createdAt: string
  imageUrl?: string
}

// Helper function to format font family
const getFontFamily = (fontFamily?: string) => {
  if (!fontFamily || fontFamily === 'System Default') return 'inherit';
  const fontMap: Record<string, string> = {
    'Archivo': `'Archivo', sans-serif`,
    'Inter': `'Inter', sans-serif`,
    'Poppins': `'Poppins', sans-serif`,
    'Montserrat': `'Montserrat', sans-serif`,
    'Roboto': `'Roboto', sans-serif`,
    'Lato': `'Lato', sans-serif`,
    'Nunito': `'Nunito', sans-serif`,
    'Work Sans': `'Work Sans', sans-serif`,
    'Playfair Display': `'Playfair Display', serif`,
    'Merriweather': `'Merriweather', serif`,
  };
  return fontMap[fontFamily] || fontFamily;
};

interface CareersSettings {
  bannerImage?: string
  bannerTitle: string
  bannerSubtitle: string
  bannerDescription: string
  bannerOverlay: string
  bannerHeight: string
  bannerWidth: string
  bannerBorderRadius: string
  titleColor: string
  titleFontSize: string
  subtitleColor: string
  subtitleFontSize: string
  descriptionColor: string
  descriptionFontSize: string
  logoImage?: string
  logoHeight: string
  logoWidth: string
  companyName: string
  menuItems: Array<{
    id: string
    label: string
    url: string
    order: number
  }>
  navFontFamily?: string
  navFontSize?: string
  navFontUrl?: string
  globalFontFamily?: string
  globalFontUrl?: string
  // Card settings
  cardContainerRadius?: string
  cardImageRadius?: string
  cardPadding?: string
  cardShadow?: string
  cardHoverLift?: boolean
  cardImageHeight?: string
  cardTitleSize?: string
  cardTitleColor?: string
  cardTitleFontFamily?: string
  cardDescriptionSize?: string
  cardDescriptionColor?: string
  cardDescriptionFontFamily?: string
  cardShowIcons?: boolean
  cardGridColumns?: number
  // Button styling
  cardButtonClass?: string
  cardButtonBg?: string
  cardButtonText?: string
  cardButtonBorder?: string
  cardButtonBorderColor?: string
  cardButtonRadius?: string
  cardButtonFontFamily?: string
  cardButtonFontSize?: string
  cardButtonFontWeight?: string
  cardButtonLabel?: string
  // Custom CSS
  customCss?: string
  // Footer settings
  footerEnabled?: boolean
  footerBgColor?: string
  footerTextColor?: string
  footerPadding?: string
  footerFontFamily?: string
  footerFontSize?: string
  footerFontWeight?: string
  footerBorderTop?: string
  footerBorderBottom?: string
  footerBorderLeft?: string
  footerBorderRight?: string
  footerBorderColor?: string
  copyrightEnabled?: boolean;
  copyrightLeftHtml?: string;
  copyrightRightHtml?: string;
  copyrightBgColor?: string;
  copyrightTextColor?: string;
  copyrightDividerEnabled?: boolean;
  copyrightDividerWidth?: string;
  copyrightDividerHeight?: string;
  copyrightDividerColor?: string;
  copyrightDividerBorderTop?: string;
  copyrightDividerBorderBottom?: string;
  copyrightDividerBorderLeft?: string;
  copyrightDividerBorderRight?: string;
  copyrightDividerBorderStyle?: string;
  socialLinks?: Array<{
    id: string
    platform: string
    url: string
    iconImage?: string
    order: number
  }>
  // Share icons
  shareIconsEnabled?: boolean
  shareIcons?: {
    facebook?: string
    facebookImage?: string
    twitter?: string
    twitterImage?: string
    linkedin?: string
    linkedinImage?: string
    whatsapp?: string
    whatsappImage?: string
    email?: string
    emailImage?: string
  }
  shareIconWidth?: string
  shareIconHeight?: string
  shareIconBorderRadius?: string
  // Filter visibility
  showFilters?: boolean
  showSearchFilter?: boolean
  showDepartmentFilter?: boolean
  showExperienceFilter?: boolean
  // Footer widgets
  footerColumns?: number
  footerWidth?: string
  columnCustomClasses?: string[]
  footerWidgets?: Array<{
    id: string
    type: 'logo' | 'text' | 'menu' | 'html' | 'social'
    title?: string
    content: string
    menuItems?: Array<{ label: string; url: string }>
    logoImage?: string
    logoWidth?: string
    logoHeight?: string
    twoColumns?: boolean
    customClass?: string
    order: number
    columnIndex: number
  }>
}

export default function CareersPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<CareersSettings>({
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
  })
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedExperience, setSelectedExperience] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayCount, setDisplayCount] = useState(9)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const jobCardsRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchJobs()
    fetchSettings()
  }, [])

  useEffect(() => {
    console.log('🔄 Settings state changed:', settings)
    console.log('🖼️ Share Icons in state:', settings.shareIcons)
    console.log('🎴 Card Settings:', {
      cardContainerRadius: settings.cardContainerRadius,
      cardImageRadius: settings.cardImageRadius,
      cardPadding: settings.cardPadding,
      cardShadow: settings.cardShadow,
      cardHoverLift: settings.cardHoverLift,
      cardImageHeight: settings.cardImageHeight
    })
  }, [settings])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/careers-settings/public')
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Careers Page - Fetched settings:', data.settings)
        console.log('🎨 Share Icons from API:', data.settings?.shareIcons)
        console.log('🔍 Checking icon paths:')
        console.log('  - FB:', data.settings?.shareIcons?.facebookImage)
        console.log('  - LinkedIn:', data.settings?.shareIcons?.linkedinImage)
        console.log('  - Email:', data.settings?.shareIcons?.emailImage)
        
        console.log('🦶 Footer Widgets:', data.settings?.footerWidgets?.length || 0)
        if (data.settings?.footerWidgets) {
          data.settings.footerWidgets.forEach((w: any, i: number) => {
            console.log(`   Widget ${i+1}: type="${w.type}", id="${w.id}"`)
            if (w.type === 'logo') {
              console.log(`      logoImage: ${w.logoImage || 'NOT SET'}`)
            }
          })
        }
        
        if (data.settings) {
          setSettings(data.settings)
          console.log('✅ Settings state updated')
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs/public')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const departments = Array.from(new Set(jobs.map(job => job.department).filter(Boolean)))
  const experienceLevels = Array.from(new Set(jobs.map(job => job.experienceLevel).filter(Boolean)))

  const filteredJobs = jobs.filter(job => {
    const matchesDepartment = selectedDepartment === 'all' || job.department === selectedDepartment
    const matchesExperience = selectedExperience === 'all' || job.experienceLevel === selectedExperience
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesDepartment && matchesExperience && matchesSearch
  })

  // Jobs to display (limited by displayCount)
  const displayedJobs = filteredJobs.slice(0, displayCount)
  const hasMore = displayCount < filteredJobs.length

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(9)
  }, [selectedDepartment, selectedExperience, searchQuery])

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          setIsLoadingMore(true)
          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setDisplayCount(prev => prev + 9)
            setIsLoadingMore(false)
          }, 300)
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loading, displayCount])

  // Animate job cards when they load or when display count changes
  useEffect(() => {
    if (!loading && jobCardsRef.current && displayedJobs.length > 0) {
      const cards = jobCardsRef.current.querySelectorAll('.job-card')
      
      // Animate only the new cards that were just added
      const previousCount = displayCount - 9
      const startIndex = Math.max(0, previousCount)
      const newCards = Array.from(cards).slice(startIndex)
      
      if (newCards.length > 0) {
        // Set initial state for new cards
        gsap.set(newCards, {
          opacity: 0,
          y: 50,
          scale: 0.9,
        })
        
        // Animate them in
        gsap.to(newCards, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.1,
          clearProps: 'all',
        })
      }
    }
  }, [displayCount, loading, displayedJobs.length])

  const shareJob = (job: Job, platform: string) => {
    const url = `${window.location.origin}/careers/${job.id}`
    const text = `Check out this job opportunity: ${job.title}`
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
        break
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo and Menu */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Company Name */}
            <div className="flex items-center space-x-3">
              {settings.logoImage && (
                <div
                  className="relative"
                  style={{
                    width: settings.logoWidth || '40px',
                    height: settings.logoHeight || '40px',
                  }}
                >
                  
                  <Image
                    src={settings.logoImage}
                    alt={settings.companyName || 'Logo'}
                    fill
                    className="object-contain"
                    unoptimized
                    onError={(e) => {
                      console.error('❌ Logo failed to load:', settings.logoImage);
                      console.error('Error details:', e);
                    }}
                    onLoad={() => {
                      console.log('✅ Logo loaded successfully:', settings.logoImage);
                    }}
                  />
                </div>
              )}
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {settings.companyName}
              </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              {settings.menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                  style={{
                    fontFamily: getFontFamily(settings.navFontFamily),
                    fontSize: settings.navFontSize || '16px',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Banner Section */}
      <div className="flex justify-center bg-gray-100">
        <div
          className="relative text-white overflow-hidden"
          style={{
            height: settings.bannerHeight,
            width: settings.bannerWidth,
            maxWidth: "100%",
            borderRadius: settings.bannerBorderRadius,
          }}
        >
          {/* Background Image */}
          {settings.bannerImage && (
            <div className="absolute inset-0">
              <Image
                src={settings.bannerImage}
                alt="Banner"
                fill
                className="object-cover"
                unoptimized
                priority
              />
            </div>
          )}

          {/* Overlay with custom gradient/color */}
          <div
            className="absolute inset-0"
            style={{
              background: settings.bannerOverlay,
            }}
          ></div>

          <div className="relative h-full flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm mb-6 opacity-90">
              <Link href="/" className="hover:underline transition-colors">
                Home
              </Link>
              <span>›</span>
              <span>{settings.bannerTitle}</span>
            </div>

            {/* Main Title */}
            <h1
              className="font-bold max-w-4xl"
              style={{
                color: settings.titleColor,
                fontSize: settings.titleFontSize,
              }}
            >
              {settings.bannerTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* Content Section - Below Banner */}
      <div className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="font-semibold mb-4"
            style={{
              color:
                settings.subtitleColor === "#ffffff"
                  ? "#1f2937"
                  : settings.subtitleColor,
              fontSize: settings.subtitleFontSize,
            }}
          >
            {settings.bannerSubtitle}
          </h2>
          <p
            className="leading-relaxed max-w-5xl mx-auto"
            style={{
              color:
                settings.descriptionColor === "#f3f4f6"
                  ? "#4b5563"
                  : settings.descriptionColor,
              fontSize: settings.descriptionFontSize,
            }}
          >
            {settings.bannerDescription}
          </p>
        </div>
      </div>

      {/* Filters Section */}
      {settings.showFilters !== false && (
        <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className={`grid grid-cols-1 gap-4 ${
              [settings.showSearchFilter, settings.showDepartmentFilter, settings.showExperienceFilter].filter(Boolean).length === 3 ? 'md:grid-cols-3' :
              [settings.showSearchFilter, settings.showDepartmentFilter, settings.showExperienceFilter].filter(Boolean).length === 2 ? 'md:grid-cols-2' :
              'md:grid-cols-1'
            }`}>
              {/* Search */}
              {settings.showSearchFilter !== false && (
                <div>
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  />
                </div>
              )}

              {/* Department Filter */}
              {settings.showDepartmentFilter !== false && (
                <div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Experience Filter */}
              {settings.showExperienceFilter !== false && (
                <div>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  >
                    <option value="all">All Experience Levels</option>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <>
            <div
              ref={jobCardsRef}
              className={`grid gap-6 ${
                settings.cardGridColumns === 1 ? 'grid-cols-1' :
                settings.cardGridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}
              key={`${settings.cardContainerRadius}-${settings.cardPadding}-${settings.cardShadow}`}
            >
              {displayedJobs.map((job) => {
                const radius = settings.cardContainerRadius || '12px';
                
                return (
                <div
                  key={job.id}
                  className={`job-card bg-white holayam transition-all duration-300 group ${settings.cardHoverLift !== false ? 'hover:shadow-xl hover:-translate-y-1' : ''}`}
                  style={{
                    borderRadius: radius,
                    borderTopLeftRadius: radius,
                    borderTopRightRadius: radius,
                    borderBottomLeftRadius: radius,
                    borderBottomRightRadius: radius,
                    padding: settings.cardPadding || '20px',
                    boxShadow: settings.cardShadow === 'none' ? 'none' : 
                               settings.cardShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' :
                               settings.cardShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.10)' :
                               settings.cardShadow === 'xl' ? '0 20px 25px rgba(0,0,0,0.12)' :
                               '0 4px 6px rgba(0,0,0,0.08)', // default md
                    overflow: 'hidden'
                  }}
                >
                  {/* Job Image */}
                  <div 
                    className="relative bg-gradient-to-br rounded-xl from-indigo-500 to-purple-600 overflow-hidden"
                    style={{
                      height: settings.cardImageHeight || '257px',
                      borderRadius: settings.cardImageRadius || '12px',
                    }}
                  >
                    {job.imageUrl ? (
                      <Image
                        src={job.imageUrl}
                        alt={job.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white ">
                          <Briefcase className="h-16 w-16 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium opacity-75">
                            {job.department}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>

                  {/* Job Content */}
                  <div className="p-6 text-center">
                    <div className="mb-12">
                      <h3 
                        className="font-bold mb-2 group-hover:text-indigo-600 transition-colors"
                        style={{
                          fontSize: settings.cardTitleSize || '25px',
                          color: settings.cardTitleColor || '#56585d',
                          fontFamily: getFontFamily(settings.cardTitleFontFamily),
                        }}
                      >
                        {job.title}
                      </h3>

                      <p 
                        className="mb-4 line-clamp-2"
                        style={{
                          fontSize: settings.cardDescriptionSize || '16px',
                          color: settings.cardDescriptionColor || '#333333',
                          fontFamily: getFontFamily(settings.cardDescriptionFontFamily),
                        }}
                      >
                        {job.description
                          .replace(/<[^>]*>/g, "")
                          .substring(0, 120)}
                        ...
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <BrandButton
                        onClick={() => router.push(`/careers/${job.id}`)}
                        className="flex items-center gap-1 !px-4 !py-1"
                      > 
                        Know More
                        <span className="text-xl leading-none mt-[-2px]">›</span>
                      </BrandButton>

                      {/* Share Icons */}
                      <div className="flex items-center space-x-[-5px]">
                        <span className="text-sm text-gray-500 mr-1">
                          Share
                        </span>

                        {/* Facebook */}
                        <button
                          onClick={() => shareJob(job, "facebook")}
                          className="p-1 hover:opacity-70 transition"
                        >
                          <img
                            src="https://jaiveeru.co.in/wp-content/uploads/2025/04/fb.svg"
                            alt="Facebook"
                            className="h-5 w-5"
                          />
                        </button>

                        {/* LinkedIn */}
                        <button
                          onClick={() => shareJob(job, "linkedin")}
                          className="p-1 hover:opacity-70 transition"
                        >
                          <img
                            src="https://jaiveeru.co.in/wp-content/uploads/2025/04/linkedin-11.svg"
                            alt="LinkedIn"
                            className="h-5 w-5"
                          />
                        </button>

                        {/* Email */}
                        <button
                          onClick={() => shareJob(job, "email")}
                          className="p-1 hover:opacity-70 transition"
                        >
                          <img
                            src="https://jaiveeru.co.in/wp-content/uploads/2022/03/004-email.svg"
                            alt="Email"
                            className="h-5 w-5"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex justify-center items-center py-8 min-h-[60px]"
              >
                {isLoadingMore ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="text-sm text-gray-600">
                      Loading more jobs...
                    </p>
                  </div>
                ) : (
                  <div className="h-4"></div>
                )}
              </div>
            )}

            {/* Show total results */}
            {!hasMore && filteredJobs.length > 9 && (
              <div className="text-center py-8 text-gray-600">
                Showing all {filteredJobs.length} jobs
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom CSS Injection */}
      {settings.customCss && (
        <style dangerouslySetInnerHTML={{ __html: settings.customCss }} />
      )}

      {/* Footer with Widgets */}
      {settings.footerEnabled && (
        <footer
          style={{
            backgroundColor: settings.footerBgColor || '#1f2937',
            color: settings.footerTextColor || '#f3f4f6',
            padding: settings.footerPadding || '48px',
            fontFamily: settings.footerFontFamily && settings.footerFontFamily !== 'System Default' ? settings.footerFontFamily : 'inherit',
            fontSize: settings.footerFontSize || '14px',
            fontWeight: settings.footerFontWeight || '400',
            borderTopWidth: settings.footerBorderTop || '0px',
            borderBottomWidth: settings.footerBorderBottom || '0px',
            borderLeftWidth: settings.footerBorderLeft || '0px',
            borderRightWidth: settings.footerBorderRight || '0px',
            borderStyle: 'solid',
            borderColor: settings.footerBorderColor || '#374151',
          }}
        >
          <div 
            className="mx-auto px-4 sm:px-6 lg:px-8"
            style={{ maxWidth: settings.footerWidth || '1280px' }}
          >
            {/* Footer Widgets */}
            {settings.footerWidgets && settings.footerWidgets.length > 0 ? (
              <div 
                className="grid gap-8"
                style={{ 
                  gridTemplateColumns: `repeat(${settings.footerColumns || 4}, 1fr)`,
                }}
              >
                {Array.from({ length: settings.footerColumns || 4 }, (_, columnIndex) => {
                  const columnWidgets = settings.footerWidgets!
                    .filter(w => w.columnIndex === columnIndex)
                    .sort((a, b) => a.order - b.order)
                  const columnClass = settings.columnCustomClasses?.[columnIndex] || ''

                  return (
                    <div key={columnIndex} className={`space-y-6 ${columnClass}`}>
                      {columnWidgets.map(widget => (
                        <div key={widget.id} className={widget.customClass || ''}>
                          {/* Logo Widget */}
                          {widget.type === 'logo' && widget.logoImage && (
                            <div>
                              <img
                                src={widget.logoImage}
                                alt="Logo"
                                style={{
                                  width: widget.logoWidth || '150px',
                                  height: widget.logoHeight || '50px',
                                  objectFit: 'contain',
                                }}
                              />
                            </div>
                          )}

                          {/* Text Widget */}
                          {widget.type === 'text' && (
                            <div>
                              {widget.title && (
                                <h3 className="text-lg font-semibold mb-3" style={{ color: settings.footerTextColor || '#f3f4f6' }}>{widget.title}</h3>
                              )}
                              <p className="text-sm opacity-90 whitespace-pre-line" style={{ color: settings.footerTextColor || '#f3f4f6' }}>{widget.content}</p>
                            </div>
                          )}

                          {/* Menu Widget */}
                          {widget.type === 'menu' && widget.menuItems && (
                            <div>
                              {widget.title && (
                                <h3 className="text-lg font-semibold mb-3" style={{ color: settings.footerTextColor || '#f3f4f6' }}>{widget.title}</h3>
                              )}
                              <ul 
                                className={`space-y-2 text-sm ${widget.twoColumns ? 'grid grid-cols-2 gap-x-4' : ''}`}
                              >
                                {widget.menuItems.map((item, index) => (
                                  <li key={index}>
                                    <Link
                                      href={item.url}
                                      className="opacity-90 hover:opacity-100 hover:underline transition-opacity"
                                      style={{ color: settings.footerTextColor || '#f3f4f6' }}
                                    >
                                      {item.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* HTML Widget */}
                          {widget.type === 'html' && (
                            <div>
                              {widget.title && (
                                <h3 className="text-lg font-semibold mb-3" style={{ color: settings.footerTextColor || '#f3f4f6' }}>{widget.title}</h3>
                              )}
                              <div 
                                className="text-sm opacity-90"
                                style={{ color: settings.footerTextColor || '#f3f4f6' }}
                                dangerouslySetInnerHTML={{ __html: widget.content }}
                              />
                            </div>
                          )}

                          {/* Social Widget */}
                          {widget.type === 'social' && settings.socialLinks && settings.socialLinks.length > 0 && (
                            <div>
                              {widget.title && (
                                <h3 className="text-lg font-semibold mb-3" style={{ color: settings.footerTextColor || '#f3f4f6' }}>{widget.title}</h3>
                              )}
                              <div className="flex gap-4">
                                {settings.socialLinks.map((link) => (
                                  <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-70 transition-opacity"
                                    title={link.platform}
                                  >
                                    {link.iconImage ? (
                                      <img src={link.iconImage} alt={link.platform} className="w-6 h-6" />
                                    ) : (
                                      <span className="text-sm font-medium">{link.platform}</span>
                                    )}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Fallback: Show social links if no widgets configured */
              settings.socialLinks && settings.socialLinks.length > 0 && (
                <div className="flex justify-center gap-6">
                  {settings.socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-70 transition-opacity"
                      title={link.platform}
                    >
                      {link.iconImage ? (
                        <img src={link.iconImage} alt={link.platform} className="w-6 h-6" />
                      ) : (
                        <span className="text-sm font-medium">{link.platform}</span>
                      )}
                    </a>
                  ))}
                </div>
              )
            )}
          </div>
        </footer>
      )}

      {/* Copyright Footer */}
      {settings.copyrightEnabled && (
        <>
          {/* Divider Above Copyright */}
          {settings.copyrightDividerEnabled && (
            <div
              className="mx-auto"
              style={{
                width: settings.copyrightDividerWidth || '100%',
                height: settings.copyrightDividerHeight || '1px',
                backgroundColor: settings.copyrightDividerColor || '#374151',
                borderTopWidth: settings.copyrightDividerBorderTop || '1px',
                borderBottomWidth: settings.copyrightDividerBorderBottom || '0px',
                borderLeftWidth: settings.copyrightDividerBorderLeft || '0px',
                borderRightWidth: settings.copyrightDividerBorderRight || '0px',
                borderStyle: settings.copyrightDividerBorderStyle || 'solid',
                borderColor: settings.copyrightDividerColor || '#374151',
              }}
            />
          )}
          
          <div
            style={{
              backgroundColor: settings.copyrightBgColor || '#111827',
              color: settings.copyrightTextColor || '#9ca3af',
              padding: '16px',
            }}
          >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
              <div dangerouslySetInnerHTML={{ __html: settings.copyrightLeftHtml || '' }} />
              <div dangerouslySetInnerHTML={{ __html: settings.copyrightRightHtml || '' }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
