'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Search,
  Filter,
  Download,
  LogOut,
  Briefcase,
  Settings,
  Archive,
  ArchiveX,
  ChevronDown,
  Plus,
  FormInput
} from 'lucide-react'
import { User } from '@/types/user'

interface Application {
  id: string
  candidateName: string
  position: string
  status: string
  appliedAt: string
  email: string
}

function ApplicationsContent() {
  const [user, setUser] = useState<User | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalApplications, setTotalApplications] = useState(0)
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [archiveMode, setArchiveMode] = useState<'normal' | 'archive'>('normal')
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const itemsPerPage = 10
  const router = useRouter()
  const searchParams = useSearchParams()

  const fetchApplications = useCallback(async (page: number = 1) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Build query parameters
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        page: page.toString()
      })
      
      // Add status filter if one is selected
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      // Use different endpoint for archive mode
      const endpoint = archiveMode === 'archive' 
        ? `/api/applications/archive?${params.toString()}`
        : `/api/applications?${params.toString()}`

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
        setTotalPages(data.totalPages || 1)
        setTotalApplications(data.total || 0)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    }
  }, [itemsPerPage, statusFilter, archiveMode])

  useEffect(() => {
    // Initialize status filter from URL parameters
    const status = searchParams.get('status')
    if (status) {
      setStatusFilter(status)
    }
    
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
          await fetchApplications(1)
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
  }, [router, searchParams, fetchApplications])

  // Refetch applications when status filter changes
  useEffect(() => {
    if (user) {
      fetchApplications(1) // Reset to page 1 when filter changes
    }
  }, [statusFilter, user, fetchApplications, archiveMode])

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

  // Handle bulk archive/unarchive operations
  const handleBulkArchive = async (isArchived: boolean) => {
    if (selectedApplications.length === 0) return

    setBulkActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/applications/bulk-archive', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationIds: selectedApplications,
          isArchived
        })
      })

      if (response.ok) {
        // Refresh the applications list
        await fetchApplications(currentPage)
        setSelectedApplications([])
        // Show success message (you can add toast notification here)
        alert(`${selectedApplications.length} application(s) ${isArchived ? 'archived' : 'unarchived'} successfully`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to update applications'}`)
      }
    } catch (error) {
      console.error('Bulk archive error:', error)
      alert('Failed to update applications')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Handle individual archive operation
  const handleSingleArchive = async (applicationId: string, isArchived: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/applications/archive', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId,
          isArchived
        })
      })

      if (response.ok) {
        // Refresh the applications list
        await fetchApplications(currentPage)
        // Show success message
        alert(`Application ${isArchived ? 'archived' : 'unarchived'} successfully`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to update application'}`)
      }
    } catch (error) {
      console.error('Archive error:', error)
      alert('Failed to update application')
    }
  }

  // Handle checkbox selection
  const handleSelectApplication = (applicationId: string) => {
    setSelectedApplications(prev => {
      if (prev.includes(applicationId)) {
        return prev.filter(id => id !== applicationId)
      } else {
        return [...prev, applicationId]
      }
    })
  }

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id))
    }
  }

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

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.replace(/[_\s]/g, '').toUpperCase()
    switch (normalizedStatus) {
      case 'SELECTED':
        return 'bg-green-100 text-green-800'
      case 'INTERVIEW':
        return 'bg-blue-100 text-blue-800'
      case 'REJECTED':
      case 'REJECT':
        return 'bg-red-100 text-red-800'
      case 'UNDERREVIEW':
      case 'UNDER-REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'PENDING':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredApplications = applications.filter(app => {
    // Only client-side search filtering now, status filtering is done server-side
    const matchesSearch = !searchTerm || 
      app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
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
              <Link href="/applications" className="text-indigo-600 font-medium flex items-center space-x-1">
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {archiveMode === 'archive' ? 'Archived Applications' : 'Job Applications'}
            </h1>
            <p className="mt-2 text-gray-600">
              {archiveMode === 'archive' 
                ? 'Manage archived job applications'
                : 'Manage and review job applications from candidates'
              }
            </p>
          </div>

          {/* Archive Mode Toggle */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => {
                    setArchiveMode('normal')
                    setSelectedApplications([])
                    setCurrentPage(1)
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    archiveMode === 'normal'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Active Applications</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setArchiveMode('archive')
                    setSelectedApplications([])
                    setCurrentPage(1)
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    archiveMode === 'archive'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Archive className="h-4 w-4" />
                    <span>Archived Applications</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedApplications.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-indigo-800">
                    {selectedApplications.length} application(s) selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {archiveMode === 'normal' ? (
                    <button
                      onClick={() => handleBulkArchive(true)}
                      disabled={bulkActionLoading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      {bulkActionLoading ? 'Archiving...' : 'Archive Selected'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBulkArchive(false)}
                      disabled={bulkActionLoading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <ArchiveX className="h-4 w-4 mr-1" />
                      {bulkActionLoading ? 'Unarchiving...' : 'Unarchive Selected'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedApplications([])}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Applications
              </label>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search by name, position, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 text-gray-600 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <Filter className="h-5 w-5 absolute left-3 top-3 text-gray-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none text-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="SELECTED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-gray-200">
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => {
                  const isPending = application.status === 'PENDING'
                  return (
                    <tr 
                      key={application.id} 
                      className={`hover:bg-gray-50 ${isPending ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(application.id)}
                          onChange={() => handleSelectApplication(application.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${isPending ? 'bg-blue-100' : 'bg-gray-300'}`}>
                              <span className={`font-medium text-xs sm:text-sm ${isPending ? 'text-blue-700' : 'text-gray-700'}`}>
                                {application.candidateName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                            <div className={`text-sm ${isPending ? 'font-bold' : 'font-medium'}`}>
                              <Link 
                                href={`/applications/${application.id}`}
                                className={`hover:text-indigo-600 transition-colors truncate block ${isPending ? 'text-blue-900' : 'text-gray-900'}`}
                              >
                                {application.candidateName}
                              </Link>
                            </div>
                            <div className={`text-xs sm:text-sm truncate ${isPending ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                              {application.email}
                            </div>
                          {/* Show position on mobile */}
                          <div className="text-xs text-gray-400 md:hidden mt-1 truncate">
                            {application.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {application.position}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)} max-w-full truncate`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/applications/${application.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </Link>
                        {archiveMode === 'normal' ? (
                          <button
                            onClick={() => handleSingleArchive(application.id, true)}
                            className="inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                            title="Archive Application"
                          >
                            <Archive className="h-3 w-3" />
                            <span className="hidden lg:inline ml-1">Archive</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSingleArchive(application.id, false)}
                            className="inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            title="Unarchive Application"
                          >
                            <ArchiveX className="h-3 w-3" />
                            <span className="hidden lg:inline ml-1">Unarchive</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {applications.length === 0 
                  ? "No applications have been submitted yet."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          )}
          
          {/* Pagination */}
          {totalApplications > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => fetchApplications(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchApplications(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalApplications)}</span>
                    {' '}to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalApplications)}</span>
                    {' '}of{' '}
                    <span className="font-medium">{totalApplications}</span>
                    {' '}applications
                  </p>
                </div>
                
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => fetchApplications(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => fetchApplications(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => fetchApplications(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <ApplicationsContent />
    </Suspense>
  )
}
