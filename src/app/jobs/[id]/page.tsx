'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, ArrowLeft, MapPin, Clock, Users, Share2, LogOut, FileText, Settings, ChevronDown, Plus, FormInput } from 'lucide-react'
import { User } from '@/types/user'

interface Job {
  id: string
  title: string
  description: string
  location: string
  position?: string
  status: string
  createdAt: string
  applicationsCount?: number
  creator: {
    name: string
    email: string
  }
  form?: {
    id: string
    name: string
  }
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [job, setJob] = useState<Job | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const router = useRouter()
  const resolvedParams = use(params)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          // Continue without user - public access
        }
      }
    }

    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setJob(data)
        } else {
          setError('Job not found')
        }
      } catch {
        setError('Failed to load job')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    fetchJob()
  }, [resolvedParams.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showJobsDropdown) {
        const target = event.target as Element
        if (!target.closest('.relative')) {
          setShowJobsDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showJobsDropdown])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      router.push('/login')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        setShowShareMenu(false)
        // Could add a toast notification here
        return
      }
    } catch {
      console.log('Clipboard API failed, trying fallback method')
    }
    
    // Fallback method for older browsers or when clipboard API is blocked
    try {
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        setShowShareMenu(false)
        // Could add a toast notification here
      } else {
        // Final fallback - just show the URL for manual copying
        prompt('Copy this URL:', url)
        setShowShareMenu(false)
      }
    } catch {
      // Ultimate fallback - show URL in prompt
      prompt('Copy this URL:', url)
      setShowShareMenu(false)
    }
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getJobStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Accepting Applications'
      case 'PAUSED':
        return 'Temporarily Closed'
      case 'DRAFT':
        return 'Draft'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">404 - Job Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested job does not exist.'}</p>
          <Link href="/jobs" className="text-indigo-600 hover:text-indigo-500">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Only show if user is logged in */}
      {user && (
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-semibold text-gray-900">
                  Job Portal
                </Link>
              </div>
              <div className="flex items-center space-x-8">
                <div className="relative">
                  <button
                    onClick={() => setShowJobsDropdown(!showJobsDropdown)}
                    className="text-gray-700 hover:text-gray-900 flex items-center space-x-1 focus:outline-none"
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>Jobs</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showJobsDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        <Link
                          href="/jobs"
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setShowJobsDropdown(false)}
                        >
                          <Briefcase className="h-4 w-4" />
                          <span>View All Jobs</span>
                        </Link>
                        <Link
                          href="/jobs/new"
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setShowJobsDropdown(false)}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Job</span>
                        </Link>
                        <Link
                          href="/admin/form-builder"
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setShowJobsDropdown(false)}
                        >
                          <FormInput className="h-4 w-4" />
                          <span>Create Form</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <Link href="/applications" className="text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>Applications</span>
                </Link>
                {(user.role?.name === 'Administrator' || user.role?.name === 'Human Resources') && (
                  <Link href="/admin" className="text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    {user.name} ({user.role?.name || 'Guest'})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb - Show different text based on user status */}
        <div className="mb-6">
          {user && ['Administrator', 'Human Resources', 'Manager'].includes(user.role?.name || '') ? (
            <Link href="/jobs" className="inline-flex items-center text-indigo-600 hover:text-indigo-500">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>
          ) : (
            <div className="text-sm text-gray-500">
              <Link href="/" className="text-indigo-600 hover:text-indigo-500">
                Home
              </Link>
              <span className="mx-2">•</span>
              <span>Job Details</span>
            </div>
          )}
        </div>

        {/* Job Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-8 bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
                <div className="flex items-center space-x-4 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    <span>{job.position}</span>
                  </div>
                  {job.location && (
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getJobStatusColor(job.status)}`}>
                    {getJobStatusText(job.status)}
                  </span>
                  {job.applicationsCount !== undefined && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                      <Users className="h-4 w-4 mr-1" />
                      {job.applicationsCount} applicant{job.applicationsCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Share Button */}
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="px-6 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div 
              className="prose max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>

          {/* Apply Section - Only show if job is active */}
          {job.status === 'ACTIVE' && (
            <div className="px-6 py-6 bg-gray-50 border-t">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900">Ready to Apply?</h3>
                  <p className="text-gray-600">Join our team and make an impact.</p>
                </div>
                <Link 
                  href={`/jobs/${job.id}/apply`}
                  className="inline-flex items-center px-8 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Apply for this Position
                </Link>
              </div>
            </div>
          )}

          {/* Job Closed Message */}
          {job.status !== 'ACTIVE' && (
            <div className="px-6 py-6 bg-red-50 border-t">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  This Position is Currently {job.status === 'PAUSED' ? 'Paused' : 'Closed'}
                </h3>
                <p className="text-red-700">
                  {job.status === 'PAUSED' 
                    ? 'Applications are temporarily not being accepted for this position.'
                    : 'This job posting is no longer accepting applications.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  )
}
