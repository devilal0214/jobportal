'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Users, Lock, Activity, CheckCircle } from 'lucide-react'
import { useAlert } from '@/contexts/AlertContext'

interface SecurityLog {
  id: string
  action: string
  userId: string
  userEmail: string
  ipAddress: string
  timestamp: string
  details: string
}

interface ActiveSession {
  id: string
  userId: string
  userEmail: string
  ipAddress: string
  userAgent: string
  lastActivity: string
  isCurrentSession: boolean
}

export default function SecurityPage() {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('logs')
  const { showConfirm, showSuccess } = useAlert()

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      // Mock data for now since we don't have the backend implemented yet
      setSecurityLogs([
        {
          id: '1',
          action: 'login',
          userId: 'user1',
          userEmail: 'admin@example.com',
          ipAddress: '192.168.1.1',
          timestamp: new Date().toISOString(),
          details: 'Successful login'
        },
        {
          id: '2',
          action: 'failed_login',
          userId: 'user2',
          userEmail: 'hr@example.com',
          ipAddress: '192.168.1.2',
          timestamp: new Date(new Date().getTime() - 3600000).toISOString(),
          details: 'Invalid password attempt'
        }
      ])

      setActiveSessions([
        {
          id: '1',
          userId: 'user1',
          userEmail: 'admin@example.com',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          lastActivity: new Date().toISOString(),
          isCurrentSession: true
        },
        {
          id: '2',
          userId: 'user2',
          userEmail: 'hr@example.com',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
          lastActivity: new Date(new Date().getTime() - 1800000).toISOString(),
          isCurrentSession: false
        }
      ])
    } catch (error) {
      console.error('Failed to fetch security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = (sessionId: string) => {
    showConfirm(
      'Are you sure you want to terminate this session?',
      async () => {
        try {
          // Remove from state for now
          setActiveSessions(prev => prev.filter(session => session.id !== sessionId))
          showSuccess('Session terminated successfully.')
        } catch (error) {
          console.error('Failed to terminate session:', error)
        }
      }
    )
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'text-green-600 bg-green-50'
      case 'logout':
        return 'text-blue-600 bg-blue-50'
      case 'failed_login':
        return 'text-red-600 bg-red-50'
      case 'password_change':
        return 'text-yellow-600 bg-yellow-50'
      case 'account_locked':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-indigo-600" />
                  Security & Permissions
                </h1>
                <p className="text-gray-600 mt-1">Monitor security events and manage user sessions</p>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="mt-4">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'logs'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Activity className="h-4 w-4 inline-block mr-1" />
                  Security Logs
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'sessions'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4 inline-block mr-1" />
                  Active Sessions
                </button>
              </nav>
            </div>
          </div>

          {/* Security Logs Tab */}
          {activeTab === 'logs' && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {securityLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{log.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{session.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.ipAddress}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {session.userAgent.includes('Mobile') || session.userAgent.includes('iPhone') ? '📱 Mobile' : '💻 Desktop'}
                          <div className="text-xs text-gray-400 truncate max-w-xs">
                            {session.userAgent}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(session.lastActivity).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {session.isCurrentSession ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Current Session
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!session.isCurrentSession && (
                            <button
                              onClick={() => terminateSession(session.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Terminate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200">
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-500">
              &larr; Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
