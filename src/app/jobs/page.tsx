'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Pause, 
  Play, 
  Trash2,
  Search,
  Filter,
  LogOut,
  FileText,
  Settings,
  MapPin,
  Clock,
  Users,
  Code,
  Copy,
  X,
  FormInput,
  ChevronDown,
  Calendar,
  Building,
  SortAsc,
  FilterX
} from 'lucide-react'
import { User } from '@/types/user'

interface Job {
  id: string
  title: string
  department: string
  location: string
  status: string
  description?: string
  experienceLevel?: string
  applicationsCount: number
  createdAt: string
  formId?: string
  form?: {
    id: string
    name: string
  }
  creator: {
    name: string
    email: string
  }
}

export default function JobsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [datePostedFilter, setDatePostedFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [selectedJobForEmbed, setSelectedJobForEmbed] = useState<Job | null>(null)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const itemsPerPage = 10
  const router = useRouter()

  // Fetch jobs data with pagination
  const fetchJobsData = useCallback(async (page: number, limit: number = itemsPerPage) => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`/api/jobs?limit=${limit}&page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch jobs')
    }

    const data = await response.json()
    return {
      items: data.jobs || [],
      total: data.pagination?.total || 0,
      hasMore: page < (data.pagination?.pages || 1)
    }
  }, [])

  // Load more jobs for infinite scroll
  const loadMoreJobs = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const data = await fetchJobsData(currentPage)
      
      if (data.items.length > 0) {
        setJobs(prev => {
          // Create a map of existing job IDs to avoid duplicates
          const existingIds = new Set(prev.map(job => job.id))
          const newJobs = data.items.filter((job: Job) => !existingIds.has(job.id))
          return [...prev, ...newJobs]
        })
        setCurrentPage(prev => prev + 1)
      }
      
      setTotalJobs(data.total)
      setHasMore(data.hasMore)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchJobsData, loading, hasMore, currentPage])

  // Refresh function - resets and loads first page
  const refreshJobs = useCallback(async () => {
    setLoading(true)
    setJobs([])
    setCurrentPage(1)
    setHasMore(true)
    
    try {
      const data = await fetchJobsData(1)
      setJobs(data.items)
      setCurrentPage(2)
      setTotalJobs(data.total)
      setHasMore(data.hasMore)
    } catch (error) {
      console.error('Failed to refresh jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchJobsData])

  // Scroll handler for infinite scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      
      // Debounce scroll events
      scrollTimeout = setTimeout(() => {
        if (
          window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
          hasMore &&
          !loading
        ) {
          loadMoreJobs()
        }
      }, 100) // 100ms debounce
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [hasMore, loading, loadMoreJobs])

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          await refreshJobs()
        } else {
          localStorage.removeItem('token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, refreshJobs])

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

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`/api/jobs/${jobId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Refresh the jobs list
        await refreshJobs()
      } else {
        console.error('Failed to delete job')
        alert('Failed to delete job. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('An error occurred while deleting the job.')
    }
  }

  const handleToggleJobStatus = async (jobId: string, currentStatus: string, jobTitle: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    const action = currentStatus === 'ACTIVE' ? 'pause' : 'activate'
    
    if (!confirm(`Are you sure you want to ${action} "${jobTitle}"?`)) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`/api/jobs/${jobId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          // We need to send existing data to avoid overwriting
          title: jobs.find(j => j.id === jobId)?.title || '',
          description: (jobs.find(j => j.id === jobId))?.description || ''
        })
      })

      if (response.ok) {
        // Refresh the jobs list
        await refreshJobs()
      } else {
        console.error('Failed to update job status')
        alert('Failed to update job status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating job status:', error)
      alert('An error occurred while updating the job status.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const generateEmbedCode = (job: Job) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourjobportal.com'
    return `<iframe 
  src="${baseUrl}/embed/job/${job.id}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border: 1px solid #e5e7eb; border-radius: 8px; background: white;">
</iframe>

<!-- Alternative: JavaScript embed for responsive design -->
<div id="job-embed-${job.id}"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${baseUrl}/embed/job/${job.id}';
    iframe.width = '100%';
    iframe.height = '600';
    iframe.frameBorder = '0';
    iframe.style.border = '1px solid #e5e7eb';
    iframe.style.borderRadius = '8px';
    iframe.style.background = 'white';
    document.getElementById('job-embed-${job.id}').appendChild(iframe);
  })();
</script>`
  }

  const copyEmbedCode = () => {
    if (selectedJobForEmbed) {
      const embedCode = generateEmbedCode(selectedJobForEmbed)
      navigator.clipboard.writeText(embedCode).then(() => {
        setEmbedCopied(true)
        setTimeout(() => setEmbedCopied(false), 2000)
      })
    }
  }

  // Get unique departments and locations for filter options
  const uniqueDepartments = [...new Set(jobs.map(job => job.department).filter(Boolean))].sort()
  const uniqueLocations = [...new Set(jobs.map(job => job.location).filter(Boolean))].sort()

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setDepartmentFilter('')
    setLocationFilter('')
    setDatePostedFilter('')
    setSortBy('')
  }

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter || departmentFilter || locationFilter || datePostedFilter || sortBy

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || job.status?.toLowerCase() === statusFilter.toLowerCase()
    
    const matchesDepartment = !departmentFilter || job.department?.toLowerCase() === departmentFilter.toLowerCase()
    
    const matchesLocation = !locationFilter || job.location?.toLowerCase() === locationFilter.toLowerCase()
    
    const matchesDatePosted = !datePostedFilter || (() => {
      const jobDate = new Date(job.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - jobDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      switch (datePostedFilter) {
        case 'today':
          return diffDays <= 1
        case 'week':
          return diffDays <= 7
        case 'month':
          return diffDays <= 30
        case '3months':
          return diffDays <= 90
        default:
          return true
      }
    })()
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesLocation && matchesDatePosted
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.title.localeCompare(b.title)
      case 'name-desc':
        return b.title.localeCompare(a.title)
      case 'latest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'applications':
        return (b.applicationsCount || 0) - (a.applicationsCount || 0)
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // Default to latest
    }
  })

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

  if (!user) {
    return null
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
                  className="text-indigo-600 font-medium flex items-center space-x-1 focus:outline-none"
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

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <p className="mt-2 text-gray-600">
              Manage job postings and track applications
            </p>
          </div>
          {(user.role?.name === 'Administrator' || user.role?.name === 'Human Resources') && (
            <Link
              href="/jobs/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create Job</span>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
              >
                <FilterX className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Jobs
              </label>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, department, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border text-gray-700  border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <Filter className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 w-full border border-gray-300 text-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Department
              </label>
              <div className="relative">
                <Building className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="pl-10 w-full border border-gray-300 text-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Location
              </label>
              <div className="relative">
                <MapPin className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10 w-full border border-gray-300 text-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Posted Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posted Within
              </label>
              <div className="relative">
                <Calendar className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <select
                  value={datePostedFilter}
                  onChange={(e) => setDatePostedFilter(e.target.value)}
                  className="pl-10 w-full border border-gray-300 text-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="3months">Past 3 Months</option>
                </select>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="relative">
                <SortAsc className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-10 w-full border border-gray-300 text-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Latest First</option>
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="applications">Most Applications</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{filteredJobs.length}</span> of{' '}
                <span className="font-medium">{jobs.length}</span> jobs
                {hasActiveFilters && (
                  <span className="block text-xs text-indigo-600 mt-1">
                    Filters applied
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Link 
                    href={`/jobs/${job.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2"
                  >
                    {job.title}
                  </Link>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {job.department || 'Not specified'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {job.location || 'Not specified'}
                  </div>
                  {job.experienceLevel && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {job.experienceLevel}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {job.applicationsCount || 0} applications
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-end items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedJobForEmbed(job)
                          setShowEmbedModal(true)
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Get Embed Code"
                      >
                        <Code className="h-4 w-4" />
                      </button>
                      {(user.role?.name === 'Administrator' || user.role?.name === 'Human Resources') && (
                        <>
                          <Link
                            href={`/jobs/${job.id}/edit`}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit Job"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          {job.formId && (
                            <Link
                              href={`/admin/form-builder?editId=${job.formId}`}
                              className="text-purple-600 hover:text-purple-900"
                              title="Edit Form"
                            >
                              <FormInput className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleToggleJobStatus(job.id, job.status, job.title)}
                            className="text-gray-600 hover:text-gray-900"
                            title={job.status === 'ACTIVE' ? 'Pause Job' : 'Activate Job'}
                          >
                            {job.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.id, job.title)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Job"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {jobs.length === 0 
                ? "No job openings have been created yet."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {(user.role?.name === 'Administrator' || user.role?.name === 'Human Resources') && jobs.length === 0 && (
              <div className="mt-6">
                <Link
                  href="/jobs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first job
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Infinite Scroll Loading Indicator */}
        {loading && (
          <div className="mt-8 flex justify-center py-4">
            <div className="text-sm text-gray-500">Loading more jobs...</div>
          </div>
        )}
        
        {/* Jobs Count */}
        {totalJobs > 0 && (
          <div className="mt-8">
            <div className="text-sm text-gray-700">
              Showing {jobs.length} of {totalJobs} jobs
              {!hasMore && jobs.length > 0 && <span className="ml-2 text-gray-500">(All jobs loaded)</span>}
            </div>
          </div>
        )}
      </div>

      {/* Embed Code Modal */}
      {showEmbedModal && selectedJobForEmbed && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Embed Code for &quot;{selectedJobForEmbed.title}&quot;
              </h3>
              <button
                onClick={() => {
                  setShowEmbedModal(false)
                  setSelectedJobForEmbed(null)
                  setEmbedCopied(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Copy this code and paste it into any website where you want to display this job opening. 
                The embedded job will include the application form and all data will be saved to your database.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Embed Code (HTML + JavaScript)
                  </label>
                  <button
                    onClick={copyEmbedCode}
                    className={`flex items-center px-3 py-1 text-sm rounded ${
                      embedCopied 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {embedCopied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={generateEmbedCode(selectedJobForEmbed)}
                  className="w-full h-48 p-3 text-xs font-mono text-gray-700 bg-white border border-gray-300 rounded resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Features:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Responsive design that works on any website</li>
                <li>• Complete job description and application form</li>
                <li>• Applications saved directly to your database</li>
                <li>• Tracks source domain and page URL</li>
                <li>• No registration required for applicants</li>
                <li>• Mobile-friendly interface</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyEmbedCode}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center justify-center"
              >
                <Copy className="h-4 w-4 mr-2" />
                {embedCopied ? 'Copied to Clipboard!' : 'Copy Embed Code'}
              </button>
              <Link
                href={`/embed/job/${selectedJobForEmbed.id}`}
                target="_blank"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Preview
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
