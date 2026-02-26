'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Send, AlertCircle } from 'lucide-react'
import { useAlert } from '@/contexts/AlertContext'

export default function SMTPTestPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { showSuccess, showError } = useAlert()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/smtp-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          message,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        showSuccess('Test Email Sent Successfully!\n\n' + data.message)
      } else {
        const details = data.details ? (typeof data.details === 'object' && data.details !== null ? JSON.stringify(data.details, null, 2) : String(data.details)) : ''
        showError('Test Email Failed\n\n' + data.message + (details ? '\n\nDetails: ' + details : ''))
      }
    } catch (error) {
      showError('Failed to send test email\n\n' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <Link
          href="/admin"
          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium inline-flex items-center mb-6"
        >
          &larr; Back to Admin Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SMTP Test</h1>
            <p className="text-gray-600">Verify your SMTP configuration by sending a test email</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter recipient email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              The email address that will receive the test email
            </p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Test Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Enter a custom message for the test email (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700  focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional custom message to include in the test email
            </p>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Test Email
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-medium">About SMTP Testing</h4>
              <p className="mt-1">
                This form uses the SMTP settings configured in your system to send a test email. 
                If the test fails, check your SMTP configuration in the admin settings.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>SMTP Host and Port</li>
                <li>Authentication credentials</li>
                <li>From email address</li>
                <li>Security settings (TLS/SSL)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
