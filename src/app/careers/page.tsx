'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock,
  Share2,
  Facebook,
  Linkedin,
  Mail,
  Calendar
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
}

export default function CareersPage() {
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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/careers-settings/public')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
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
                    width: settings.logoWidth,
                    height: settings.logoHeight
                  }}
                >
                  <Image
                    src={settings.logoImage}
                    alt={settings.companyName}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
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
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
            maxWidth: '100%',
            borderRadius: settings.bannerBorderRadius
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
              />
            </div>
          )}
          
          {/* Overlay with custom gradient/color */}
          <div 
            className="absolute inset-0"
            style={{
              background: settings.bannerOverlay
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
                fontSize: settings.titleFontSize
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
              color: settings.subtitleColor === '#ffffff' ? '#1f2937' : settings.subtitleColor,
              fontSize: settings.subtitleFontSize
            }}
          >
            {settings.bannerSubtitle}
          </h2>
          <p 
            className="leading-relaxed max-w-5xl mx-auto"
            style={{
              color: settings.descriptionColor === '#f3f4f6' ? '#4b5563' : settings.descriptionColor,
              fontSize: settings.descriptionFontSize
            }}
          >
            {settings.bannerDescription}
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Department Filter */}
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

            {/* Experience Filter */}
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
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            <div ref={jobCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedJobs.map((job) => (
                <div key={job.id} className="job-card bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                {/* Job Image */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
                  {job.imageUrl ? (
                    <Image
                      src={job.imageUrl}
                      alt={job.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Briefcase className="h-16 w-16 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium opacity-75">{job.department}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>

                {/* Job Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {job.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {job.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
                  </p>

                  {/* Job Details */}
                  <div className="space-y-2 mb-4">
                    {job.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
                        {job.location}
                      </div>
                    )}
                    
                    {job.department && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="h-4 w-4 mr-2 text-indigo-500" />
                        {job.department}
                      </div>
                    )}
                    
                    {job.experienceLevel && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-indigo-500" />
                        {job.experienceLevel}
                      </div>
                    )}
                    
                    {job.salary && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2 text-indigo-500" />
                        {job.salary}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Link
                      href={`/careers/${job.id}`}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Know More
                      <span className="ml-2">›</span>
                    </Link>

                    {/* Share Menu */}
                    <div className="relative group/share">
                      <button className="p-2 text-gray-500 hover:text-indigo-600 transition-colors">
                        <Share2 className="h-5 w-5" />
                      </button>
                      
                      <div className="absolute right-0 bottom-full mb-2 w-auto bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/share:opacity-100 group-hover/share:visible transition-all duration-200 z-10">
                        <div className="flex p-2 space-x-1">
                          <button
                            onClick={() => shareJob(job, 'facebook')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Share on Facebook"
                          >
                            <Facebook className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => shareJob(job, 'linkedin')}
                            className="p-2 text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="Share on LinkedIn"
                          >
                            <Linkedin className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => shareJob(job, 'email')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Share via Email"
                          >
                            <Mail className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center items-center py-8 min-h-[60px]">
              {isLoadingMore ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="text-sm text-gray-600">Loading more jobs...</p>
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
    </div>
  )
}
