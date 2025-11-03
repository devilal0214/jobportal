'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Mail, Send, CheckCircle, AlertCircle, Users, Settings, Edit3 } from 'lucide-react'

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
  const [recipientMode, setRecipientMode] = useState<'roles' | 'email'>('roles')
  const [customTemplate, setCustomTemplate] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [isEditingTemplate, setIsEditingTemplate] = useState(false)
  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([])
  
  // Data from API
  const [roles, setRoles] = useState<Role[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

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

  useEffect(() => {
    // Initialize custom template and subject when templates load
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

    const template = getTemplateForStatus()
    if (template) {
      if (!customTemplate) {
        setCustomTemplate(template.body)
      }
      if (!customSubject) {
        setCustomSubject(template.subject)
      }
    }
  }, [selectedStatus, templates, customTemplate, customSubject])

  const fetchData = async () => {
    try {
      // Get the auth token
      const token = localStorage.getItem('token')
      if (!token) {
        setMessage({ 
          type: 'error', 
          text: 'Authentication token not found. Please login again.' 
        })
        return
      }

      const authHeaders = {
        'Authorization': `Bearer ${token}`
      }

      // Fetch roles - don't fail if this fails, just show a message
      const rolesResponse = await fetch('/api/roles?includePermissions=true', {
        headers: authHeaders
      })
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        console.log('Roles data:', rolesData)
        // rolesData has structure { roles: [...] }
        setRoles((rolesData.roles || []).filter((role: Role) => role.isSystem))
      } else {
        console.error('Failed to fetch roles:', rolesResponse.status, rolesResponse.statusText)
        if (rolesResponse.status === 401) {
          setMessage({ 
            type: 'error', 
            text: 'Authentication expired. Please refresh the page or login again.' 
          })
        }
      }

      // Fetch users - don't fail if this fails, just show a message  
      const usersResponse = await fetch('/api/users', {
        headers: authHeaders
      })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        console.log('Users data:', usersData)
        setUsers(usersData.users || [])
      } else {
        console.error('Failed to fetch users:', usersResponse.status, usersResponse.statusText)
        // Don't set another error message if we already have one
        if (usersResponse.status === 401 && !message) {
          setMessage({ 
            type: 'error', 
            text: 'Authentication expired. Please refresh the page or login again.' 
          })
        }
      }

      // Fetch email templates
      const templatesResponse = await fetch('/api/admin/email-templates', {
        headers: authHeaders
      })
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

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(u => u !== userId)
        : [...prev, userId]
    )
  }

  const handleUserEmailToggle = (userEmail: string) => {
    setSelectedUserEmails(prev => 
      prev.includes(userEmail)
        ? prev.filter(e => e !== userEmail)
        : [...prev, userEmail]
    )
  }

  const getEmailRecipients = () => {
    return users.filter(user => 
      user.role && selectedRoles.includes(user.role.name)
    )
  }

  const getSelectedUsers = () => {
    return users.filter(user => selectedUsers.includes(user.id))
  }

  const getUsersByRoles = () => {
    return users.filter(user => 
      user.role && selectedRoles.includes(user.role.name)
    )
  }

  const getRecipientCount = () => {
    if (recipientMode === 'roles') {
      return selectedUsers.length > 0 ? selectedUsers.length : selectedUserEmails.length
    } else if (recipientMode === 'email' && testEmail) {
      return 1
    }
    return 0
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
    // Validate based on recipient mode
    if (!selectedStatus) {
      setMessage({ type: 'error', text: 'Please select an application status' })
      return
    }

    if (recipientMode === 'roles' && selectedUsers.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one user' })
      return
    }

    if (recipientMode === 'email' && !testEmail) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    setSending(true)
    setMessage(null)

    try {
      const template = getTemplateForStatus()

      if (!template) {
        setMessage({ type: 'error', text: 'No email template found for selected status' })
        return
      }

      let emailRecipients: Array<{ id: string; email: string; name: string }> = []

      if (recipientMode === 'roles') {
        const selectedUsersList = getSelectedUsers()
        if (selectedUsersList.length === 0) {
          setMessage({ type: 'error', text: 'No users selected' })
          return
        }
        emailRecipients = selectedUsersList.map(r => ({ id: r.id, email: r.email, name: r.name }))
      } else if (recipientMode === 'email') {
        emailRecipients = [{ id: 'test-email', email: testEmail, name: 'Test Recipient' }]
      }

      // Send test emails
      const response = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: selectedStatus,
          roles: recipientMode === 'roles' ? selectedRoles : [],
          testEmail: recipientMode === 'email' ? testEmail : undefined,
          templateId: template.id,
          recipients: emailRecipients,
          customTemplate: isEditingTemplate ? customTemplate : undefined,
          customSubject: customSubject || template.subject
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const recipientCount = emailRecipients.length
        setMessage({ 
          type: 'success', 
          text: `✅ Test emails sent successfully! ${result.emailsSent || recipientCount} emails sent to ${recipientCount} recipients.` 
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

  // Validation for send button
  const canSendEmail = () => {
    if (!selectedStatus) return false
    if (recipientMode === 'roles' && selectedUsers.length === 0) return false
    if (recipientMode === 'email' && !testEmail) return false
    return true
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
          <div className="p-6 space-y-8">
            {/* Recipient Selection Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Recipients
              </label>
              <div className="space-y-4">
                {/* Radio buttons for recipient selection method */}
                <div className="flex flex-col space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recipientMode"
                      value="roles"
                      checked={recipientMode === 'roles'}
                      onChange={(e) => setRecipientMode(e.target.value as 'roles' | 'email')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">By User Roles</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recipientMode"
                      value="email"
                      checked={recipientMode === 'email'}
                      onChange={(e) => setRecipientMode(e.target.value as 'roles' | 'email')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Specific Email Address</span>
                  </label>
                </div>

                {/* Role and User Selection (when roles mode is selected) */}
                {recipientMode === 'roles' && (
                  <div className="ml-7 space-y-4 border-l-2 border-gray-200 pl-4">
                    {/* Role Selection */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">First, select user roles:</p>
                      {roles.length > 0 ? (
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
                      ) : (
                        <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded border border-amber-200">
                          <div className="flex items-center mb-2">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <strong>Unable to Load Roles</strong>
                          </div>
                          <p className="mb-2">Cannot load user roles at the moment. This might be a temporary issue.</p>
                          <div className="text-xs text-amber-700">
                            <p>Debug info: {loading ? 'Loading...' : `Roles count: ${roles.length}`}</p>
                            <p className="mt-1">
                              <button 
                                onClick={() => window.location.reload()}
                                className="underline hover:no-underline cursor-pointer"
                              >
                                Click here to refresh the page
                              </button>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* User Selection based on roles */}
                    {selectedRoles.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Then, select specific users:</p>
                        {users.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                            {getUsersByRoles().map((user) => (
                              <label key={user.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.id)}
                                  onChange={() => handleUserToggle(user.id)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm text-gray-700">
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-gray-500 ml-1">({user.email}) - {user.role.name}</span>
                                </span>
                              </label>
                            ))}
                            {getUsersByRoles().length === 0 && (
                              <p className="text-sm text-gray-500">No users found with selected roles</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded border border-amber-200">
                            <div className="flex items-center mb-2">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              <strong>Cannot Load Users</strong>
                            </div>
                            <p className="mb-2">Unable to load users at the moment. This might be a temporary issue.</p>
                            <div className="text-xs text-amber-700">
                              <p>Debug info: Users count: {users.length}</p>
                              <p className="mt-1">
                                <button 
                                  onClick={() => window.location.reload()}
                                  className="underline hover:no-underline cursor-pointer"
                                >
                                  Refresh page
                                </button>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Email Input (when email mode is selected) */}
                {recipientMode === 'email' && (
                  <div className="ml-7 border-l-2 border-gray-200 pl-4">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter the specific email address to receive the test email
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Application Status Selection - Moved near template */}
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
                This will determine which email template is used and auto-populate the editor below
              </p>
            </div>

            {/* Template Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Template
                </label>
                <button
                  onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  {isEditingTemplate ? 'View Preview' : 'Edit Template'}
                </button>
              </div>
              
              {isEditingTemplate ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                      placeholder="Enter email subject..."
                    />
                  </div>
                  <div>
                    <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Body
                    </label>
                    <textarea
                      id="template"
                      value={customTemplate}
                      onChange={(e) => setCustomTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-mono text-sm"
                      rows={10}
                      placeholder="Enter your email template..."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      You can use variables like {'{applicant_name}'}, {'{job_title}'}, {'{status}'}, etc.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  {selectedTemplate ? (
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Mail className="h-4 w-4 mr-1" />
                        <span>Template: <strong>{selectedTemplate.name}</strong></span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Subject: <em>{customSubject || selectedTemplate.subject}</em>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                        {customTemplate || selectedTemplate.body}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      ⚠️ No active email template found for this status
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Email Preview</h3>
              
              {/* Recipients */}
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Recipients ({getRecipientCount()} total):</span>
                </div>
                <div className="space-y-1">
                  {recipientMode === 'roles' && (
                    <>
                      {getSelectedUsers().map((user) => (
                        <div key={user.id} className="text-sm text-gray-700 pl-5">
                          • {user.name} ({user.email}) - {user.role.name}
                        </div>
                      ))}
                      {getSelectedUsers().length === 0 && (
                        <div className="text-sm text-gray-500 pl-5">
                          No users selected
                        </div>
                      )}
                    </>
                  )}
                  {recipientMode === 'email' && testEmail && (
                    <div className="text-sm text-gray-700 pl-5">
                      • Test Email ({testEmail})
                    </div>
                  )}
                  {recipientMode === 'email' && !testEmail && (
                    <div className="text-sm text-gray-500 pl-5">
                      No email address provided
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
                  disabled={sending || !canSendEmail()}
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
