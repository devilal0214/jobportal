'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock,
  Calendar,
  ArrowLeft,
  Share2,
  Facebook,
  Linkedin,
  Mail,
  CheckCircle
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
  bannerImageUrl?: string
  formId?: string
}

interface CareersSettings {
  bannerOverlay: string
  bannerHeight: string
  bannerWidth: string
  bannerBorderRadius: string
  logoImage?: string
  logoHeight: string
  logoWidth: string
  companyName: string
}

export default function CareerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<CareersSettings>({
    bannerOverlay: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
    bannerHeight: '400px',
    bannerWidth: '100%',
    bannerBorderRadius: '0px',
    logoHeight: '40px',
    logoWidth: '40px',
    companyName: 'Job Portal'
  })

  useEffect(() => {
    const fetchJob = async (id: string) => {
      try {
        const response = await fetch(`/api/jobs/public/${id}`)
        if (response.ok) {
          const data = await response.json()
          setJob(data)
        } else {
          router.push('/careers')
        }
      } catch (error) {
        console.error('Failed to fetch job:', error)
        router.push('/careers')
      } finally {
        setLoading(false)
      }
    }

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

    if (params?.id) {
      fetchJob(params.id as string)
    }
    fetchSettings()
  }, [params?.id, router])

  const shareJob = (platform: string) => {
    if (!job) return
    
    const url = window.location.href
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!job) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
              <Link href="/careers" className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                {settings.companyName}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Banner */}
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
          {/* Background Image - Use banner image if available, otherwise use card image */}
          {(job.bannerImageUrl || job.imageUrl) && (
            <div className="absolute inset-0">
              <Image
                src={job.bannerImageUrl || job.imageUrl || ''}
                alt={job.title}
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
          
          <div className="relative h-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8">
            {/* Back Button */}
            <Link
              href="/careers"
              className="inline-flex items-center text-white hover:text-indigo-200 transition-colors mb-4 w-fit"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to all jobs
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {job.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-white">
              {job.location && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  {job.location}
                </div>
              )}
              {job.department && (
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  {job.department}
                </div>
              )}
              {job.experienceLevel && (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {job.experienceLevel}
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div 
                className="prose prose-lg prose-indigo max-w-none
                  [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h1]:mt-6
                  [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-5
                  [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mb-2 [&_h3]:mt-4
                  [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mb-2 [&_h4]:mt-3
                  [&_h5]:text-base [&_h5]:font-semibold [&_h5]:text-gray-900 [&_h5]:mb-2 [&_h5]:mt-3
                  [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:text-gray-900 [&_h6]:mb-2 [&_h6]:mt-3
                  [&_p]:text-gray-700 [&_p]:mb-4 [&_p]:leading-relaxed
                  [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ul]:text-gray-700
                  [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_ol]:text-gray-700
                  [&_li]:mb-2 [&_li]:text-gray-700 [&_li]:leading-relaxed
                  [&_strong]:font-bold [&_strong]:text-gray-900
                  [&_em]:italic [&_em]:text-gray-700
                  [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-4
                  [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-gray-800
                  [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4
                  [&_hr]:border-gray-300 [&_hr]:my-6"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Apply Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Interested?</h3>
              
              {job.salary && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center text-gray-600 mb-2">
                    <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
                    <span className="text-sm font-medium">Salary</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{job.salary}</p>
                </div>
              )}

              <Link
                href={job.formId ? `/embed/job/${job.id}` : `/careers/${job.id}/apply`}
                className="block w-full bg-indigo-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors mb-4"
              >
                Apply Now
              </Link>

              {/* Share Options */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Share this job</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => shareJob('facebook')}
                    className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Share on Facebook"
                  >
                    <Facebook className="h-5 w-5 mx-auto text-blue-600" />
                  </button>
                  <button
                    onClick={() => shareJob('linkedin')}
                    className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="h-5 w-5 mx-auto text-blue-700" />
                  </button>
                  <button
                    onClick={() => shareJob('email')}
                    className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Share via Email"
                  >
                    <Mail className="h-5 w-5 mx-auto text-gray-600" />
                  </button>
                  <button
                    onClick={() => shareJob('copy')}
                    className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Copy Link"
                  >
                    <Share2 className="h-5 w-5 mx-auto text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Job Details Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Job Details</h3>
              
              <div className="space-y-4">
                {job.position && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Position</p>
                    <p className="font-medium text-gray-900">{job.position}</p>
                  </div>
                )}
                
                {job.department && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Department</p>
                    <p className="font-medium text-gray-900">{job.department}</p>
                  </div>
                )}
                
                {job.experienceLevel && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Experience Level</p>
                    <p className="font-medium text-gray-900">{job.experienceLevel}</p>
                  </div>
                )}
                
                {job.location && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium text-gray-900">{job.location}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Actively Hiring
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
