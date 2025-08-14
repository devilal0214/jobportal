'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, ArrowLeft, LogOut, Briefcase, FileText, Settings, ChevronDown, Plus, FormInput } from 'lucide-react'
import HTMLEditor from '@/components/HTMLEditor'

interface User {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
  } | null;
}

interface Form {
  id: string
  name: string
  isDefault: boolean
}

interface Job {
  id: string
  title: string
  position: string
  location: string
  description: string
  status: string
  formId: string
}

const JOB_POSITIONS = [
  'Graphic Designer',
  'Video Editor', 
  'Google Ads Specialist',
  'Content Writer',
  'Social Media Manager',
  'Web Developer',
  'Mobile App Developer',
  'UI/UX Designer',
  'Digital Marketing Specialist',
  'SEO Specialist',
  'Data Analyst',
  'Project Manager',
  'Software Engineer',
  'DevOps Engineer',
  'Quality Assurance Tester',
  'Business Analyst',
  'Sales Manager',
  'Customer Success Manager',
  'HR Specialist',
  'Accountant',
  'Other'
]

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const [user, setUser] = useState<User | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    position: '',
    location: '',
    description: '',
    status: 'ACTIVE',
    formId: ''
  })
  const [customTitle, setCustomTitle] = useState('')
  const [showCustomTitle, setShowCustomTitle] = useState(false)
  const [availableForms, setAvailableForms] = useState([])
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return false
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          if (!['Administrator', 'Human Resources'].includes((userData as User).role?.name || '')) {
            router.push('/jobs')
            return false
          }
          setUser(userData)
          return true
        } else {
          localStorage.removeItem('token')
          router.push('/login')
          return false
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
        return false
      }
    }

    const fetchJob = async () => {
      const token = localStorage.getItem('token')
      if (!token) return false

      try {
        const response = await fetch(`/api/jobs/${resolvedParams.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const jobData = await response.json()
          setJob(jobData)
          setFormData({
            title: jobData.title,
            position: jobData.position || '',
            location: jobData.location || '',
            description: jobData.description,
            status: jobData.status,
            formId: jobData.formId || ''
          })
          
          // Check if it's a custom title
          if (!JOB_POSITIONS.includes(jobData.title)) {
            setCustomTitle(jobData.title)
            setShowCustomTitle(true)
            setFormData(prev => ({ ...prev, title: 'Other' }))
          }
          return true
        } else {
          setError('Job not found')
          return false
        }
      } catch (error) {
        console.error('Failed to fetch job:', error)
        setError('Failed to load job')
        return false
      }
    }

    const fetchForms = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/admin/forms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const forms = await response.json()
          setAvailableForms(forms)
        }
      } catch (error) {
        console.error('Failed to fetch forms:', error)
      }
    }

    const loadData = async () => {
      const authSuccess = await checkAuth()
      if (authSuccess) {
        const jobSuccess = await fetchJob()
        if (jobSuccess) {
          await fetchForms()
        }
      }
      setLoading(false)
    }

    loadData()
  }, [router, resolvedParams.id])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const finalTitle = showCustomTitle ? customTitle : formData.title
      
      const response = await fetch(`/api/jobs/${resolvedParams.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          title: finalTitle
        })
      })

      if (response.ok) {
        router.push(`/jobs/${resolvedParams.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update job')
      }
    } catch (error) {
      console.error('Update job error:', error)
      setError('An error occurred while updating the job')
    } finally {
      setSaving(false)
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

  if (!user || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The job you are looking for does not exist.'}</p>
          <Link href="/jobs" className="text-indigo-600 hover:text-indigo-500">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
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
              <Link href="/admin" className="text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
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

      {/* Page Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href={`/jobs/${resolvedParams.id}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Details
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
          <p className="mt-2 text-gray-600">
            Update job information and settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Job Information</h2>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={showCustomTitle ? customTitle : formData.title}
                onChange={(e) => {
                  if (showCustomTitle) {
                    setCustomTitle(e.target.value)
                  } else {
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter job title (e.g., Senior React Developer, Marketing Manager)"
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                Job Position *
              </label>
              <select
                id="position"
                name="position"
                required
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a position level</option>
                <option value="Intern">Intern</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter job location (e.g., New York, NY / Remote / Hybrid)"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Role *
              </label>
              <div className="mt-1">
                <HTMLEditor
                  value={formData.description || ''}
                  onChange={(value: string) => setFormData(prev => ({ ...prev, description: value || '' }))}
                  placeholder="Enter detailed job description with requirements, responsibilities, and benefits..."
                  height={250}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Use the toolbar to format your job description with headings, lists, and styling.
              </p>
            </div>

            <div>
              <label htmlFor="formId" className="block text-sm font-medium text-gray-700 mb-2">
                Assign Job Form *
              </label>
              <select
                id="formId"
                name="formId"
                required
                value={formData.formId}
                onChange={(e) => setFormData(prev => ({ ...prev, formId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select application form</option>
                {availableForms.map((form: Form) => (
                  <option key={form.id} value={form.id}>{form.name}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Choose the application form that candidates will fill out for this position. Create <a href="/admin/form-builder" className="text-indigo-600 hover:text-indigo-500">a new form</a>
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Job Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border text-gray-600 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="DRAFT">Draft (Not Published)</option>
                <option value="ACTIVE">Published (Accepting Applications)</option>
                <option value="PAUSED">Paused (Temporarily Closed)</option>
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <Link
              href={`/jobs/${resolvedParams.id}`}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
