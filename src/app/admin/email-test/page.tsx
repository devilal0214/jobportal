'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, Send, CheckCircle, AlertCircle, Users, Settings } from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string
  isSystem: boolean
}

interface EmailTemplate {
  id: string
  name: string
  type: string
  subject: string
  body: string
  isActive: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: Role
}

export default function EmailTestPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form data
  const [selectedStatus, setSelectedStatus] = useState('SHORTLISTED')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Administrator'])
  const [testEmail, setTestEmail] = useState('test@example.com')
  
  // Data from API
  const [roles, setRoles] = useState<Role[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [users, setUsers] = useState<User[]>([])

  const applicationStatuses = [
    { value: 'SHORTLISTED', label: 'Shortlisted', description: 'Candidate has been shortlisted for next round' },
    { value: 'SELECTED', label: 'Selected', description: 'Candidate has been selected for the position' },
    { value: 'REJECTED', label: 'Rejected', description: 'Candidate application has been rejected' },
    { value: 'UNDER_REVIEW', label: 'Under Review', description: 'Application is currently under review' },
    { value: 'INTERVIEW', label: 'Interview Scheduled', description: 'Interview has been scheduled' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch roles
      const rolesResponse = await fetch('/api/roles?includePermissions=true')
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        setRoles(rolesData.filter((role: Role) => role.isSystem))
      }

      // Fetch users
      const usersResponse = await fetch('/api/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }

      // Fetch email templates
      const templatesResponse = await fetch('/api/admin/email-templates')
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setTemplates(templatesData.filter((template: EmailTemplate) => template.isActive))
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage({ type: 'error', text: 'Failed to load data' })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    )
  }

  const getEmailRecipients = () => {
    return users.filter(user => 
      user.role && selectedRoles.includes(user.role.name)
    )
  }

  const getTemplateForStatus = () => {
    const statusTemplateMap: { [key: string]: string } = {
      'SHORTLISTED': 'APPLICATION_STATUS',
      'SELECTED': 'APPLICATION_STATUS', 
      'REJECTED': 'APPLICATION_STATUS',
      'UNDER_REVIEW': 'APPLICATION_STATUS',
      'INTERVIEW': 'INTERVIEW_SCHEDULED'
    }
    
    const templateType = statusTemplateMap[selectedStatus] || 'APPLICATION_STATUS'
    return templates.find(t => t.type === templateType)
  }

  const handleSendTestEmail = async () => {
    if (!selectedStatus || selectedRoles.length === 0) {
      setMessage({ type: 'error', text: 'Please select status and at least one role' })
      return
    }

    setSending(true)
    setMessage(null)

    try {
      const recipients = getEmailRecipients()
      const template = getTemplateForStatus()

      if (!template) {
        setMessage({ type: 'error', text: 'No email template found for selected status' })
        return
      }

      if (recipients.length === 0) {
        setMessage({ type: 'error', text: 'No users found with selected roles' })
        return
      }

      // Send test emails
      const response = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          roles: selectedRoles,
          testEmail,
          templateId: template.id,
          recipients: recipients.map(r => ({ id: r.id, email: r.email, name: r.name }))
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `✅ Test emails sent successfully! ${result.emailsSent} emails sent to ${recipients.length} recipients.` 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send test emails' })
      }

    } catch (error) {
      console.error('Error sending test emails:', error)
      setMessage({ type: 'error', text: 'Network error while sending emails' })
    } finally {
      setSending(false)
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

  const selectedTemplate = getTemplateForStatus()
  const recipients = getEmailRecipients()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-xl font-semibold text-gray-900">
                Job Portal Admin
              </Link>
              <span className="ml-2 text-gray-500">/</span>
              <span className="ml-2 text-gray-700">Email Testing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Page Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Mail className="h-6 w-6 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email System Testing</h1>
                <p className="text-gray-600 mt-1">Test email delivery for different application statuses and user roles</p>
              </div>
            </div>
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`mx-6 mt-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <div className="ml-3">
                  <p className={`text-sm ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Application Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                {applicationStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label} - {status.description}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                This will determine which email template is used
              </p>
            </div>

            {/* User Roles Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Roles (Recipients)
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.name)}
                      onChange={() => handleRoleToggle(role.name)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      <span className="font-medium">{role.name}</span>
                      <span className="text-gray-500 ml-1">- {role.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Users with selected roles will receive the test email
              </p>
            </div>

            {/* Test Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Test Email (Optional)
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              />
              <p className="mt-1 text-sm text-gray-500">
                An additional email address to receive the test email
              </p>
            </div>

            {/* Preview Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Email Preview</h3>
              
              {/* Template Info */}
              {selectedTemplate ? (
                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Mail className="h-4 w-4 mr-1" />
                    <span>Template: <strong>{selectedTemplate.name}</strong></span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Subject: <em>{selectedTemplate.subject}</em>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-600 mb-4">
                  ⚠️ No active email template found for this status
                </div>
              )}

              {/* Recipients */}
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Recipients ({recipients.length + (testEmail ? 1 : 0)} total):</span>
                </div>
                <div className="space-y-1">
                  {recipients.map((user) => (
                    <div key={user.id} className="text-sm text-gray-700 pl-5">
                      • {user.name} ({user.email}) - {user.role.name}
                    </div>
                  ))}
                  {testEmail && (
                    <div className="text-sm text-gray-700 pl-5">
                      • Test Email ({testEmail})
                    </div>
                  )}
                  {recipients.length === 0 && !testEmail && (
                    <div className="text-sm text-gray-500 pl-5">
                      No recipients selected
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex items-center justify-between">
              <Link
                href="/admin"
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                ← Back to Admin Dashboard
              </Link>
              
              <div className="flex items-center space-x-3">
                <Link
                  href="/admin/email-templates"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Templates
                </Link>
                
                <button
                  onClick={handleSendTestEmail}
                  disabled={sending || !selectedStatus || selectedRoles.length === 0}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Emails
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">How Email Testing Works</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Application Status:</strong> Determines which email template will be used</p>
            <p>• <strong>User Roles:</strong> Filters users who will receive the email based on their assigned roles</p>
            <p>• <strong>Email Templates:</strong> Must be active and assigned to the selected status type</p>
            <p>• <strong>SMTP Configuration:</strong> Must be properly configured in admin settings for actual delivery</p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>💡 Quick Setup Check:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Email templates: {templates.length} active</li>
                <li>System users: {users.length} total</li>
                <li>Available roles: {roles.length} system roles</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
