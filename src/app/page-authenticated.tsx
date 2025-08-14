'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Briefcase, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  Eye,
  Edit,
  Pause,
  Play,
  Clock
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Job {
  id: string
  title: string
  department: string
  location: string
  status: string
  applicationsCount: number
  createdAt: string
}

interface Application {
  id: string
  candidateName: string
  position: string
  status: string
  appliedAt: string
  email: string
}

interface DashboardStats {
  newApplications: number
  totalApplications: number
  underReview: number
  totalJobs: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    newApplications: 0,
    totalApplications: 0,
    underReview: 0,
    totalJobs: 0
  })
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // Verify token and get user info
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
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

    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        // Fetch dashboard stats
        const statsResponse = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        // Fetch recent applications
        const applicationsResponse = await fetch('/api/applications?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json()
          setRecentApplications(applicationsData.applications || [])
        }

        // Fetch jobs
        const jobsResponse = await fetch('/api/jobs?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json()
          setJobs(jobsData.jobs || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
    }

    const init = async () => {
      await checkAuth()
      await fetchDashboardData()
    }
    init()
  }, [router])

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
    switch (status.toLowerCase()) {
      case 'selected':
        return 'bg-green-100 text-green-800'
      case 'interview':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
      case 'reject':
        return 'bg-red-100 text-red-800'
      case 'under review':
      case 'under-review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
              <h1 className="text-xl font-semibold text-gray-900">Job Portal</h1>
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/jobs" className="text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                <Briefcase className="h-4 w-4" />
                <span>Job Openings</span>
              </Link>
              <Link href="/applications" className="text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>Applications</span>
              </Link>
              {((user as any).role?.name === 'Administrator' || (user as any).role?.name === 'Human Resources') && (
                <Link href="/admin" className="text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  Welcome, {user.name} ({(user as any).role?.name || 'Guest'})
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

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.newApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.underReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Briefcase className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalJobs}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
              <Link 
                href="/applications" 
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
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
                    {recentApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {application.candidateName}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate">
                              {application.email}
                            </div>
                            {/* Show position on mobile */}
                            <div className="text-xs text-gray-400 sm:hidden mt-1 truncate">
                              {application.position}
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            {application.position}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)} max-w-full truncate`}>
                            {application.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <Link
                            href={`/applications/${application.id}`}
                            className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors whitespace-nowrap space-x-1"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recentApplications.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No applications yet
                </div>
              )}
            </div>
          </div>

          {/* Job Openings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Job Openings</h2>
              <div className="flex space-x-2">
                {((user as any).role?.name === 'Administrator' || (user as any).role?.name === 'Human Resources') && (
                  <Link
                    href="/jobs/new"
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Job</span>
                  </Link>
                )}
                <Link 
                  href="/jobs" 
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {job.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.department} • {job.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.applicationsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          job.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {((user as any).role?.name === 'Administrator' || (user as any).role?.name === 'Human Resources') && (
                            <>
                              <Link
                                href={`/jobs/${job.id}/edit`}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button className="text-gray-600 hover:text-gray-900">
                                {job.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {jobs.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No jobs posted yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
