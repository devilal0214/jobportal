'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { debugToken, validateTokenForAPI } from '@/lib/debug-token'
import { checkEnvironment } from '@/lib/env-check'
import { 
  ChevronLeft, 
  Send, 
  X, 
  User,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface Recipient {
  id: string
  email: string
  name?: string
}

interface Candidate {
  id: string
  email: string
  name: string
  jobTitle?: string
}

interface EmailTemplate {
  name: string
  subject: string
  content: string
}

let recipientIdCounter = 0;
const generateRecipientId = () => {
  recipientIdCounter += 1;
  return `recipient_${recipientIdCounter}`;
};

export default function EmailSendPage() {
  const router = useRouter()
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Debug: Log showSuggestions changes
  useEffect(() => {
    console.log('showSuggestions changed to:', showSuggestions);
  }, [showSuggestions]);

  // Fetch candidates on component mount
  useEffect(() => {
    const fetchCandidates = async () => {
      setCandidatesLoading(true)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.log('No token found when fetching candidates')
          return
        }

        console.log('Fetching candidates with token:', token ? 'Token present' : 'No token')
        
        const response = await fetch('/api/admin/candidates', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('Candidates response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          setCandidates(data.candidates || [])
        } else if (response.status === 401) {
          console.log('Authentication failed when fetching candidates')
          setMessage({ 
            type: 'error', 
            text: 'Authentication failed. Please login again.' 
          })
          localStorage.removeItem('token')
          router.push('/login')
        } else {
          console.error('Failed to fetch candidates, status:', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch candidates:', error)
      } finally {
        setCandidatesLoading(false)
      }
    }

    fetchCandidates()
  }, [router, setMessage])

  // Filter candidates based on email input
  useEffect(() => {
    if (emailInput.trim()) {
      const filtered = candidates.filter(candidate => 
        candidate.email.toLowerCase().includes(emailInput.toLowerCase()) ||
        candidate.name.toLowerCase().includes(emailInput.toLowerCase())
      )
      setFilteredCandidates(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      // When no input, show all candidates
      setFilteredCandidates(candidates)
      setShowSuggestions(false) // Don't auto-show when empty, will show on focus
    }
  }, [emailInput, candidates])

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const addRecipient = () => {
    const email = emailInput.trim()
    if (!email) return

    if (!isValidEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    if (recipients.some(r => r.email === email)) {
      setMessage({ type: 'error', text: 'Email already added' })
      return
    }

    const newRecipient: Recipient = {
      id: generateRecipientId(),
      email: email,
      name: email.split('@')[0] // Use part before @ as name
    }

    setRecipients([...recipients, newRecipient])
    setEmailInput('')
    setMessage(null)
  }

  const removeRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id))
  }

  const handleEmailInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addRecipient()
    }
  }

  const selectCandidate = (candidate: Candidate) => {
    if (recipients.some(r => r.email === candidate.email)) {
      setMessage({ type: 'error', text: 'Candidate already added' })
      return
    }

    const newRecipient: Recipient = {
      id: candidate.id,
      email: candidate.email,
      name: candidate.name
    }

    setRecipients([...recipients, newRecipient])
    setEmailInput('')
    setShowSuggestions(false)
    setMessage(null)
  }

  const addAllCandidates = () => {
    const newRecipients = candidates
      .filter(candidate => !recipients.some(r => r.email === candidate.email))
      .map(candidate => ({
        id: candidate.id,
        email: candidate.email,
        name: candidate.name
      }))

    if (newRecipients.length === 0) {
      setMessage({ type: 'error', text: 'All candidates are already added' })
      return
    }

    setRecipients([...recipients, ...newRecipients])
    setMessage({ type: 'success', text: `Added ${newRecipients.length} candidates` })
  }

  const clearAllRecipients = () => {
    setRecipients([])
    setMessage(null)
  }

  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one recipient' })
      return
    }

    if (!subject.trim()) {
      setMessage({ type: 'error', text: 'Please enter a subject' })
      return
    }

    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Please enter email content' })
      return
    }

    setSending(true)
    setMessage(null)

    // Debug token before sending
    console.log('=== EMAIL SEND DEBUG ===')
    debugToken()
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please login again.' })
        router.push('/login')
        return
      }

      console.log('Sending email request with token:', token ? 'Token present' : 'No token')
      
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipients: recipients.map(r => r.email),
          subject,
          content
        })
      })

      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Email sent successfully to ${recipients.length} recipient(s)` 
        })
        // Clear form
        setRecipients([])
        setSubject('')
        setContent('')
      } else {
        if (response.status === 401) {
          setMessage({ 
            type: 'error', 
            text: 'Authentication failed. Please login again.' 
          })
          localStorage.removeItem('token')
          router.push('/login')
        } else {
          setMessage({ 
            type: 'error', 
            text: data.error || `Failed to send email (Status: ${response.status})` 
          })
        }
      }
    } catch (error) {
      console.error('Email send error:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to send email. Please check your connection and try again.' 
      })
    } finally {
      setSending(false)
    }
  }

  const handleDebugToken = async () => {
    console.log('=== MANUAL TOKEN DEBUG ===')
    
    // Debug token from localStorage
    debugToken()
    
    // Check environment configuration
    console.log('=== ENVIRONMENT CHECK ===')
    try {
      const response = await fetch('/api/debug/env')
      const envData = await response.json()
      console.log('Environment diagnostics:', envData)
      
      if (envData.diagnostics?.isUsingFallback) {
        console.warn('⚠️ WARNING: Server is using fallback JWT_SECRET!')
        setMessage({ 
          type: 'error', 
          text: '⚠️ WARNING: Server using fallback JWT_SECRET! Check console for details.' 
        })
        return
      }
    } catch (error) {
      console.error('Failed to check environment:', error)
    }
    
    // Test API token validation
    console.log('=== API VALIDATION TEST ===')
    const isValid = await validateTokenForAPI()
    
    setMessage({ 
      type: isValid ? 'success' : 'error', 
      text: isValid ? 'Token is valid ✅' : 'Token is invalid or expired ❌' 
    })
    
    console.log('=== DEBUG SESSION COMPLETE ===')
  }

  const getEmailTemplates = () => [
    {
      name: 'Welcome Message',
      subject: 'Welcome to Our Platform',
      content: 'Dear {{name}},\n\nWelcome to our job portal platform! We are excited to have you join our community.\n\nBest regards,\nThe Team'
    },
    {
      name: 'Application Update',
      subject: 'Application Status Update',
      content: 'Dear {{name}},\n\nWe wanted to update you on your recent job application. Your application is currently being reviewed by our team.\n\nWe will contact you soon with further updates.\n\nBest regards,\nHR Team'
    },
    {
      name: 'Job Notification',
      subject: 'New Job Opportunity Available',
      content: 'Dear {{name}},\n\nWe have a new job opportunity that might interest you. Please check our portal for the latest openings.\n\nVisit our portal to apply today!\n\nBest regards,\nRecruitment Team'
    }
  ]

  const loadTemplate = (template: EmailTemplate) => {
    setSubject(template.subject)
    setContent(template.content)
  }

  return (
    <>
      <Header 
        title="Send Email - Admin Panel"
        description="Send bulk emails to candidates and users using the system SMTP settings."
        keywords="admin, email, bulk email, SMTP, notifications"
      />
      
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            &larr; Back to Admin Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Send Email</h1>
          <p className="mt-2 text-gray-600">Send emails to multiple recipients using the system SMTP settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Email Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg p-6">
              {/* Message Alert */}
              {message && (
                <div className={`mb-6 p-4 rounded-md flex items-center ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  {message.text}
                </div>
              )}

              {/* Recipients Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients
                </label>
                <div className="space-y-3">
                  {/* Email Input with Autocomplete */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          ref={emailInputRef}
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={handleEmailInputKeyPress}
                          onFocus={() => {
                            console.log('Email input focused, total candidates:', candidates.length);
                            console.log('Current emailInput:', emailInput);
                            console.log('Current filteredCandidates:', filteredCandidates.length);
                            
                            if (emailInput.trim()) {
                              console.log('Has input, showing filtered candidates');
                              setShowSuggestions(filteredCandidates.length > 0)
                            } else {
                              // Show all candidates when focusing with no input
                              console.log('No input, showing all candidates');
                              setFilteredCandidates(candidates)
                              setShowSuggestions(candidates.length > 0)
                            }
                          }}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          placeholder="Type to search candidates or enter email address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-500"
                        />
                        
                        {/* Autocomplete Dropdown */}
                        {showSuggestions && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredCandidates.length > 0 ? (
                              <>
                                {filteredCandidates.slice(0, 5).map((candidate) => (
                                  <button
                                    key={candidate.id}
                                    type="button"
                                    onClick={() => selectCandidate(candidate)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                          <User className="w-4 h-4 text-indigo-600" />
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                                        <p className="text-sm text-gray-500">{candidate.email}</p>
                                        {candidate.jobTitle && (
                                          <p className="text-xs text-gray-400">{candidate.jobTitle}</p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                                {filteredCandidates.length > 5 && (
                                  <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
                                    +{filteredCandidates.length - 5} more candidates...
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500">
                                No candidates found matching &quot;{emailInput}&quot;
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={addRecipient}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Add
                      </button>
                    </div>
                    
                    {/* Loading indicator */}
                    {candidatesLoading && (
                      <div className="absolute right-12 top-2 text-gray-400">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Recipients Tags */}
                  {recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-[60px] border border-gray-200">
                      {recipients.map((recipient) => (
                        <span
                          key={recipient.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 border border-indigo-200"
                        >
                          <User className="h-3 w-3 mr-1" />
                          <span className="font-medium">
                            {recipient.name ? `${recipient.name} ` : ''}
                          </span>
                          <span className="text-indigo-600">
                            {recipient.name ? `(${recipient.email})` : recipient.email}
                          </span>
                          <button
                            onClick={() => removeRecipient(recipient.id)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Quick actions */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <button
                      type="button"
                      onClick={addAllCandidates}
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Add All Candidates ({candidates.length})
                    </button>
                    {recipients.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllRecipients}
                        className="text-red-600 hover:text-red-500 font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Enter email subject"
                />
              </div>

              {/* Content */}
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-500 resize-none"
                  placeholder="Enter your email content here..."
                />
                <p className="mt-2 text-sm text-gray-500">
                  You can use variables like {`{{name}}`} for personalization
                </p>
              </div>

              {/* Send Button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDebugToken}
                  className="inline-flex items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  🔍 Debug Token
                </button>
                
                <button
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Email Templates Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Email Templates
              </h3>
              <div className="space-y-3">
                {getEmailTemplates().map((template, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadTemplate(template)}
                  >
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Quick Tips
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Add multiple emails by pressing Enter</li>
                  <li>• Use {`{{name}}`} for personalization</li>
                  <li>• Templates can be customized</li>
                  <li>• Emails use system SMTP settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
