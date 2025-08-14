'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Settings, Save, Mail, Server, Shield, Database } from 'lucide-react'

interface Setting {
  id: string
  key: string
  value: string
  type: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsData, setSettingsData] = useState({
    // Email Settings
    emailHost: '',
    emailPort: '587',
    emailUser: '',
    emailPassword: '',
    emailFrom: '',
    emailFromName: '',
    
    // General Settings
    siteName: 'Job Portal',
    siteUrl: '',
    timezone: 'UTC',
    defaultLanguage: 'en',
    
    // Application Settings
    maxFileSize: '10', // MB
    allowedFileTypes: '.pdf,.doc,.docx',
    autoArchiveApplications: '90', // days
    
    // Security Settings
    sessionTimeout: '30', // minutes
    passwordMinLength: '8',
    requireMFA: 'false',
    allowRegistration: 'true'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        const settingsMap: { [key: string]: string } = {}
        data.forEach((setting: Setting) => {
          settingsMap[setting.key] = setting.value
        })
        setSettingsData(prev => ({ ...prev, ...settingsMap }))
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      })

      if (response.ok) {
        alert('Settings saved successfully!')
        fetchSettings()
      } else {
        alert('Failed to save settings. Please try again.')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('An error occurred while saving settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setSettingsData(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Settings className="h-6 w-6 mr-2 text-indigo-600" />
                  System Settings
                </h1>
                <p className="text-gray-600 mt-1">Configure your job portal settings</p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Email Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                Email Configuration
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={settingsData.emailHost}
                    onChange={(e) => handleChange('emailHost', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <input
                    type="text"
                    value={settingsData.emailPort}
                    onChange={(e) => handleChange('emailPort', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={settingsData.emailUser}
                    onChange={(e) => handleChange('emailUser', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={settingsData.emailPassword}
                    onChange={(e) => handleChange('emailPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                  <input
                    type="email"
                    value={settingsData.emailFrom}
                    onChange={(e) => handleChange('emailFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md  text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="noreply@yourcompany.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                  <input
                    type="text"
                    value={settingsData.emailFromName}
                    onChange={(e) => handleChange('emailFromName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your Company Name"
                  />
                </div>
              </div>
            </div>

            {/* General Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                <Server className="h-5 w-5 mr-2 text-green-600" />
                General Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                  <input
                    type="text"
                    value={settingsData.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300  text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site URL</label>
                  <input
                    type="url"
                    value={settingsData.siteUrl}
                    onChange={(e) => handleChange('siteUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md  text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://yoursite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={settingsData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
                  <select
                    value={settingsData.defaultLanguage}
                    onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                <Database className="h-5 w-5 mr-2 text-purple-600" />
                Application Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (MB)</label>
                  <input
                    type="number"
                    value={settingsData.maxFileSize}
                    onChange={(e) => handleChange('maxFileSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowed File Types</label>
                  <input
                    type="text"
                    value={settingsData.allowedFileTypes}
                    onChange={(e) => handleChange('allowedFileTypes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder=".pdf,.doc,.docx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auto Archive Applications (days)</label>
                  <input
                    type="number"
                    value={settingsData.autoArchiveApplications}
                    onChange={(e) => handleChange('autoArchiveApplications', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300  text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                <Shield className="h-5 w-5 mr-2 text-red-600" />
                Security Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settingsData.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Min Length</label>
                  <input
                    type="number"
                    value={settingsData.passwordMinLength}
                    onChange={(e) => handleChange('passwordMinLength', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Require MFA</label>
                  <select
                    value={settingsData.requireMFA}
                    onChange={(e) => handleChange('requireMFA', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="false">Disabled</option>
                    <option value="true">Required</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allow Registration</label>
                  <select
                    value={settingsData.allowRegistration}
                    onChange={(e) => handleChange('allowRegistration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

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
