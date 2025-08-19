'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Settings, 
  Users, 
  Mail, 
  Database,
  LogOut,
  Briefcase,
  FileText,
  Shield,
  Key,
  Bell,
  UserPlus,
  ChevronDown,
  Plus,
  FormInput,
  Send
} from 'lucide-react'
import { User } from '@/types/user'

interface DashboardStats {
  totalUsers: number
  totalJobs: number
  emailsSent: number
  pendingNotifications: number
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  icon: string
  color: string
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const router = useRouter()

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
          if (!['Administrator', 'Human Resources'].includes(userData.role?.name || '')) {
            router.push('/')
            return
          }
          setUser(userData)
          
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

          // Fetch recent activities
          const activitiesResponse = await fetch('/api/admin/activity', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (activitiesResponse.ok) {
            const activitiesData = await activitiesResponse.json()
            setActivities(activitiesData.activities || [])
          }
        } else {
          localStorage.removeItem('token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
        setActivitiesLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return FileText
      case 'Briefcase':
        return Briefcase
      case 'UserPlus':
        return UserPlus
      case 'Mail':
        return Mail
      default:
        return Bell
    }
  }

  const getActivityColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600'
      case 'green':
        return 'bg-green-100 text-green-600'
      case 'purple':
        return 'bg-purple-100 text-purple-600'
      case 'orange':
        return 'bg-orange-100 text-orange-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
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

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Email Templates',
      description: 'Create and manage email notification templates',
      icon: Mail,
      href: '/admin/email-templates',
      color: 'bg-green-500'
    },
    {
      title: 'Email Testing',
      description: 'Test email delivery for different statuses and roles',
      icon: Bell,
      href: '/admin/email-test',
      color: 'bg-cyan-500'
    },
    {
      title: 'SMTP Test',
      description: 'Verify SMTP configuration with a simple test email',
      icon: Send,
      href: '/admin/smtp-test',
      color: 'bg-indigo-500'
    },
    {
      title: 'Send Email',
      description: 'Send emails to multiple recipients with templates',
      icon: Mail,
      href: '/admin/send-email',
      color: 'bg-pink-500'
    },
    {
      title: 'System Activity',
      description: 'View recent system activities and logs',
      icon: Bell,
      href: '/admin/activity',
      color: 'bg-teal-500'
    },
    {
      title: 'Form Builder',
      description: 'Design custom application forms for jobs',
      icon: FileText,
      href: '/admin/form-builder',
      color: 'bg-purple-500'
    },
    {
      title: 'System Settings',
      description: 'Configure SMTP, notifications, and system preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-orange-500'
    },
    {
      title: 'Database Management',
      description: 'Backup, restore, and manage database',
      icon: Database,
      href: '/admin/database',
      color: 'bg-red-500'
    },
    {
      title: 'Security & Permissions',
      description: 'Manage security settings and role permissions',
      icon: Shield,
      href: '/admin/security',
      color: 'bg-indigo-500'
    }
  ]

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
              <Link href="/admin" className="text-indigo-600 font-medium flex items-center space-x-1">
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

      {/* Admin Sub-Navigation */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link href="/admin" className="text-indigo-600 border-b-2 border-indigo-600 py-4 px-1 text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 py-4 px-1 text-sm font-medium">
              Users
            </Link>
            <Link href="/admin/roles" className="text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 py-4 px-1 text-sm font-medium">
              Roles & Permissions
            </Link>
            <Link href="/admin/form-builder" className="text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 py-4 px-1 text-sm font-medium">
              Form Builder
            </Link>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage system settings, users, and configuration
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Link href="/admin/users" className="group">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-4 sm:p-6 min-h-[120px] cursor-pointer group-hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Users</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-blue-600 group-hover:text-blue-700">Manage users →</p>
              </div>
            </div>
          </Link>

          <Link href="/jobs" className="group">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-4 sm:p-6 min-h-[120px] cursor-pointer group-hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Jobs</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats?.totalJobs || 0}</p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-green-600 group-hover:text-green-700">Manage jobs →</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/email-templates" className="group">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-4 sm:p-6 min-h-[120px] cursor-pointer group-hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Emails Sent</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats?.emailsSent || 0}</p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-purple-600 group-hover:text-purple-700">Email templates →</p>
              </div>
            </div>
          </Link>

          <Link href="/applications?status=pending" className="group">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-4 sm:p-6 min-h-[120px] cursor-pointer group-hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">New Applications</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats?.pendingNotifications || 0}</p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-orange-600 group-hover:text-orange-700">Review pending →</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Admin Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => (
            <div key={card.title} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {card.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  {card.description}
                </p>
                <Link
                  href={card.href}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Configure
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent System Activity</h2>
            <Link 
              href="/admin/activity"
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {activitiesLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading activities...</p>
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity) => {
                const IconComponent = getActivityIcon(activity.icon)
                return (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 p-2 rounded-lg ${getActivityColor(activity.color)}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 flex-shrink-0">
                            {formatActivityTime(activity.timestamp)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Key className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  System activity logs will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
