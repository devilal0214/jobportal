'use client'

import { useState, useEffect, use } from 'react'
import { Briefcase, MapPin, Clock, Send } from 'lucide-react'
import TagsInput from '@/components/TagsInput'

interface FormField {
  id: string
  label: string
  fieldType: string
  placeholder?: string
  options?: string[]
  cssClass?: string
  fieldId?: string
  isRequired: boolean
  order: number
}

interface Job {
  id: string
  title: string
  position: string
  department: string
  location: string
  description: string
  requirements: string
  experienceLevel: string
  createdAt: string
  form?: {
    id: string
    name: string
    description?: string
    fields: FormField[]
  }
}

export default function EmbedJobPage({ params }: { params: Promise<{ id: string }> }) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<Record<string, string | string[]>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const resolvedParams = use(params)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setJob(data)
          
          // Initialize form data
          if (data.form?.fields) {
            const initialData: Record<string, string | string[]> = {}
            data.form.fields.forEach((field: FormField) => {
              if (field.fieldType === 'TAGS' || field.fieldType === 'CHECKBOX') {
                initialData[field.id] = []
              } else {
                initialData[field.id] = ''
              }
            })
            setFormData(initialData)
          }
        } else {
          setError('Job not found')
        }
      } catch {
        setError('Failed to load job')
      } finally {
        setLoading(false)
      }
    }
    
    if (resolvedParams.id) {
      fetchJob()
    }
  }, [resolvedParams.id])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!job?.form?.fields) return errors

    job.form.fields.forEach((field) => {
      if (field.isRequired) {
        const value = formData[field.id]
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
          errors[field.id] = `${field.label} is required`
        }
      }
    })

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setSubmitting(true)
    setValidationErrors({})

    try {
      // Capture source information
      const sourceInfo = {
        domain: typeof window !== 'undefined' ? document.referrer || window.location.hostname : '',
        pageUrl: typeof window !== 'undefined' ? document.referrer || window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      }

      // Create field labels mapping
      const fieldLabels: Record<string, string> = {}
      if (job?.form?.fields) {
        job.form.fields.forEach((field) => {
          fieldLabels[field.id] = field.label
        })
      }

      const response = await fetch('/api/applications/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: resolvedParams.id,
          formData: formData,
          sourceInfo: sourceInfo,
          fieldLabels
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({})
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit application')
      }
    } catch {
      setError('Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const updateFormData = (fieldId: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }))
    }
  }

  const renderField = (field: FormField) => {
    const fieldValue = formData[field.id] || (field.fieldType === 'TAGS' || field.fieldType === 'CHECKBOX' ? [] : '')
    const hasError = validationErrors[field.id]
    const fieldClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasError ? 'border-red-500' : 'border-gray-300'} ${field.cssClass || ''}`

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            id={field.fieldId || field.id}
            value={fieldValue as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
            required={field.isRequired}
          />
        )

      case 'EMAIL':
        return (
          <input
            type="email"
            id={field.fieldId || field.id}
            value={fieldValue as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
            required={field.isRequired}
          />
        )

      case 'PHONE':
        return (
          <input
            type="tel"
            id={field.fieldId || field.id}
            value={fieldValue as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
            required={field.isRequired}
          />
        )

      case 'TEXTAREA':
        return (
          <textarea
            id={field.fieldId || field.id}
            value={fieldValue as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
            rows={3}
            required={field.isRequired}
          />
        )

      case 'SELECT':
        return (
          <select
            id={field.fieldId || field.id}
            value={fieldValue as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={fieldClass}
            required={field.isRequired}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'RADIO':
        return (
          <div className={`space-y-2 ${field.cssClass || ''}`} id={field.fieldId || field.id}>
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={fieldValue === option}
                  onChange={(e) => updateFormData(field.id, e.target.value)}
                  className="mr-2 w-4 h-4 text-blue-600"
                  required={field.isRequired}
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'CHECKBOX':
        return (
          <div className={`space-y-2 ${field.cssClass || ''}`} id={field.fieldId || field.id}>
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={(fieldValue as string[]).includes(option)}
                  onChange={(e) => {
                    const currentValues = fieldValue as string[]
                    if (e.target.checked) {
                      updateFormData(field.id, [...currentValues, option])
                    } else {
                      updateFormData(field.id, currentValues.filter((v: string) => v !== option))
                    }
                  }}
                  className="mr-2 w-4 h-4 text-blue-600"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'TAGS':
        return (
          <TagsInput
            value={fieldValue as string[]}
            onChange={(tags) => updateFormData(field.id, tags)}
            options={field.options || []}
            placeholder={field.placeholder || 'Type to add tags...'}
            className={field.cssClass || ''}
            id={field.fieldId || field.id}
          />
        )

      case 'DATE':
        return (
          <input
            type="date"
            id={field.fieldId || field.id}
            value={fieldValue as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={fieldClass}
            required={field.isRequired}
          />
        )

      case 'NUMBER':
        return (
          <input
            type="number"
            id={field.fieldId || field.id}
            value={fieldValue as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
            required={field.isRequired}
          />
        )

      default:
        return (
          <input
            type="text"
            id={field.fieldId || field.id}
            value={fieldValue as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
            required={field.isRequired}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Job Not Available</h2>
          <p className="text-gray-600">{error || 'This job posting is no longer available.'}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for your interest in the {job.title} position. We have received your application and will review it shortly.
          </p>
          <p className="text-sm text-gray-500">
            You will receive an email confirmation at the provided email address.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Job Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
                <div className="flex flex-wrap gap-4 text-blue-100">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {job.position}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Job Description */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Job Description</h2>
                <div 
                  className="prose prose-sm max-w-none text-gray-700 mb-6"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
                
                {job.requirements && (
                  <>
                    <h3 className="text-md font-bold text-gray-900 mb-3">Requirements</h3>
                    <div 
                      className="prose prose-sm max-w-none text-gray-700 mb-6"
                      dangerouslySetInnerHTML={{ __html: job.requirements }}
                    />
                  </>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Experience Level</h4>
                  <p className="text-sm text-blue-800">{job.experienceLevel}</p>
                </div>
              </div>

              {/* Application Form */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Apply for this Position</h2>
                
                {job.form ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {job.form.fields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.isRequired && <span className="text-red-600 ml-1">*</span>}
                          </label>
                          
                          {renderField(field)}
                          
                          {validationErrors[field.id] && (
                            <p className="text-red-600 text-xs mt-1">{validationErrors[field.id]}</p>
                          )}
                        </div>
                      ))}

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No application form is currently available for this position.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
