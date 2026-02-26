'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Database, Download, Upload, AlertTriangle } from 'lucide-react'
import { useAlert } from '@/contexts/AlertContext'

export default function DatabasePage() {
  const [loading, setLoading] = useState(false)
  const { showInfo } = useAlert()

  const handleBackup = async () => {
    setLoading(true)
    // TODO: Implement database backup functionality
    setTimeout(() => {
      setLoading(false)
      showInfo('Database backup feature will be implemented in a future update.')
    }, 1000)
  }

  const handleRestore = async () => {
    setLoading(true)
    // TODO: Implement database restore functionality
    setTimeout(() => {
      setLoading(false)
      showInfo('Database restore feature will be implemented in a future update.')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          &larr; Back to Admin Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="mt-2 text-gray-600">
            Manage database backups, restore operations, and maintenance tasks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Database Backup */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Backup
                </h3>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Create a backup of the current database
            </p>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </button>
          </div>

          {/* Database Restore */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Restore Database
                </h3>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Restore database from a backup file
            </p>
            <button
              onClick={handleRestore}
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Database
                </>
              )}
            </button>
          </div>

          {/* Database Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gray-100">
                <Database className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Database Info
                </h3>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">SQLite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">prisma/dev.db</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Section */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="ml-2 text-lg font-semibold text-yellow-800">
              Important Notice
            </h3>
          </div>
          <div className="mt-2 text-yellow-700">
            <p>
              Database management features are currently under development. 
              Always ensure you have proper backups before performing any database operations.
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Backup operations will be implemented in a future update</li>
              <li>Restore functionality requires careful implementation</li>
              <li>Consider using external database management tools for now</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/users"
              className="inline-flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="text-sm font-medium text-gray-900">Manage Users</div>
            </Link>
            <Link
              href="/admin/settings"
              className="inline-flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="text-sm font-medium text-gray-900">System Settings</div>
            </Link>
            <Link
              href="/applications"
              className="inline-flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="text-sm font-medium text-gray-900">View Applications</div>
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="text-sm font-medium text-gray-900">Manage Jobs</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
