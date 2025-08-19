'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Mail, 
  Briefcase, 
  UserPlus, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Clock
} from 'lucide-react'

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  icon: string
  color: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNext: boolean
  hasPrev: boolean
}

export default function ActivityPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchActivities = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/admin/activity?page=${page}&limit=15`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setPagination(data.pagination || null)
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchActivities(currentPage)
  }, [currentPage, fetchActivities])

  const getActivityIcon = (iconName: string) => {
    const iconMap = {
      Mail,
      Briefcase,
      UserPlus,
      FileText
    }
    return iconMap[iconName as keyof typeof iconMap] || FileText
  }

  const getActivityColor = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      gray: 'bg-gray-100 text-gray-600'
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 text-gray-600'
  }

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">System Activity</h1>
          <p className="mt-2 text-gray-600">Monitor recent system events and user activities</p>
        </div>

        {/* Activity Feed */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
              {pagination && (
                <p className="text-sm text-gray-500">
                  {pagination.totalItems} total activities
                </p>
              )}
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-600">System activity logs will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activities.map((activity) => {
                const IconComponent = getActivityIcon(activity.icon)
                return (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 p-2 rounded-lg ${getActivityColor(activity.color)}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatActivityTime(activity.timestamp)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    disabled={!pagination.hasPrev}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNext}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
