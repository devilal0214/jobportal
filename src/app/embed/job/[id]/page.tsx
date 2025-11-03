'use client'

import { useState, useEffect, use } from 'react'
import { Briefcase, MapPin, Clock, Send } from 'lucide-react'
import TagsInput from '@/components/TagsInput'
import SkillsWithRatings from '@/components/SkillsWithRatings'

interface FormField {
  id: string
  label: string
  fieldType: string
  placeholder?: string
  options?: string[] | string // Can be JSON string from DB or parsed array
  cssClass?: string
  fieldId?: string
  isRequired: boolean
  order: number
}

interface SkillRating {
  skill: string
  rating: number
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
  const [formData, setFormData] = useState<Record<string, string | string[] | SkillRating[]>>({})
  const [fileData, setFileData] = useState<Record<string, File>>({})
  const [portfolioLinks, setPortfolioLinks] = useState<{ name: string; url: string }[]>([{ name: '', url: '' }])
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
            const initialData: Record<string, string | string[] | SkillRating[]> = {}
            data.form.fields.forEach((field: FormField) => {
              if (field.fieldType === 'TAGS' || field.fieldType === 'CHECKBOX') {
                initialData[field.id] = []
              } else if (field.fieldType === 'SKILLS') {
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
        
        if (field.fieldType === 'SKILLS') {
          // For skills, check if it's a valid array with at least one skill and all skills are rated
          const skills = value as SkillRating[]
          if (!skills || skills.length === 0) {
            errors[field.id] = `${field.label} is required`
          } else {
            // Check if all skills have ratings > 0
            const hasUnratedSkills = skills.some(skill => !skill.rating || skill.rating === 0)
            if (hasUnratedSkills) {
              errors[field.id] = `Please rate all skills in ${field.label}`
            }
          }
        } else if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
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

      // Prepare form data with files and portfolio links
      const submissionData = new FormData()
      submissionData.append('jobId', resolvedParams.id)
      submissionData.append('formData', JSON.stringify(formData))
      submissionData.append('sourceInfo', JSON.stringify(sourceInfo))
      submissionData.append('fieldLabels', JSON.stringify(fieldLabels))
      
      // Add portfolio links
      const validPortfolioLinks = portfolioLinks.filter(link => link.name.trim() && link.url.trim())
      submissionData.append('portfolioLinks', JSON.stringify(validPortfolioLinks))
      
      // Add files
      Object.entries(fileData).forEach(([fieldId, file]) => {
        submissionData.append(`file_${fieldId}`, file)
      })

      const response = await fetch('/api/applications/embed', {
        method: 'POST',
        body: submissionData, // Changed from JSON to FormData
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({})
        setFileData({})
        setPortfolioLinks([{ name: '', url: '' }])
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

  const updateFormData = (fieldId: string, value: string | string[] | SkillRating[]) => {
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

  // Helper function to parse options from JSON string to array
  const parseOptions = (options: unknown): string[] => {
    if (!options) return []
    if (Array.isArray(options)) return options
    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        // If JSON parse fails, try splitting by comma as fallback
        return options.split(',').map((opt: string) => opt.trim()).filter(Boolean)
      }
    }
    return []
  }

  const renderField = (field: FormField) => {
    const fieldValue = formData[field.id] || (field.fieldType === 'TAGS' || field.fieldType === 'CHECKBOX' || field.fieldType === 'SKILLS' ? [] : '')
    const hasError = validationErrors[field.id]
    const fieldClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${hasError ? 'border-red-500' : 'border-gray-300'} ${field.cssClass || ''}`
    
    // Parse options properly for select, radio, and checkbox fields
    const fieldOptions = parseOptions(field.options)

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
            {fieldOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'RADIO':
        return (
          <div className={`space-y-2 ${field.cssClass || ''}`} id={field.fieldId || field.id}>
            {fieldOptions.map((option, index) => (
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
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'CHECKBOX':
        return (
          <div className={`space-y-2 ${field.cssClass || ''}`} id={field.fieldId || field.id}>
            {fieldOptions.map((option, index) => (
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
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'TAGS':
        return (
          <TagsInput
            value={fieldValue as string[]}
            onChange={(tags) => updateFormData(field.id, tags)}
            options={fieldOptions}
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

      case 'FILE':
        return (
          <div className="space-y-2">
            <input
              type="file"
              id={field.fieldId || field.id}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Store file info for display
                  updateFormData(field.id, file.name)
                  // Store actual file separately
                  setFileData(prev => ({ ...prev, [field.id]: file }))
                }
              }}
              accept=".pdf,.doc,.docx"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required={field.isRequired}
            />
            {fieldValue && (
              <p className="text-sm text-gray-600">Selected: {fieldValue as string}</p>
            )}
          </div>
        )

      case 'SKILLS':
        return (
          <SkillsWithRatings
            value={fieldValue as SkillRating[]}
            onChange={(skills) => updateFormData(field.id, skills)}
            options={fieldOptions}
            placeholder={field.placeholder || 'Type to add skills...'}
            className={field.cssClass || ''}
            id={field.fieldId || field.id}
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

                    {/* Portfolio Links Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Portfolio Links (GitHub, personal website, etc.)
                        </label>
                        <div className="space-y-3">
                          {portfolioLinks.map((link, index) => (
                            <div key={index} className="flex gap-2">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={link.name}
                                  onChange={(e) => {
                                    const updated = [...portfolioLinks]
                                    updated[index].name = e.target.value
                                    setPortfolioLinks(updated)
                                  }}
                                  placeholder="Link name (e.g., GitHub, Portfolio)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                                />
                              </div>
                              <div className="flex-1">
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={(e) => {
                                    const updated = [...portfolioLinks]
                                    updated[index].url = e.target.value
                                    setPortfolioLinks(updated)
                                  }}
                                  placeholder="https://github.com/yourusername"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                                />
                              </div>
                              {portfolioLinks.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index))
                                  }}
                                  className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                  title="Remove link"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          
                          {portfolioLinks.length < 5 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPortfolioLinks([...portfolioLinks, { name: '', url: '' }])
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              + Add Another Link
                            </button>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500">Available:</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...portfolioLinks]
                                const index = updated.findIndex(link => link.name === '')
                                if (index !== -1) {
                                  updated[index] = { name: 'GitHub', url: 'https://github.com/' }
                                  setPortfolioLinks(updated)
                                } else if (updated.length < 5) {
                                  setPortfolioLinks([...updated, { name: 'GitHub', url: 'https://github.com/' }])
                                }
                              }}
                              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                            >
                              + GitHub
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...portfolioLinks]
                                const index = updated.findIndex(link => link.name === '')
                                if (index !== -1) {
                                  updated[index] = { name: 'Website', url: 'https://' }
                                  setPortfolioLinks(updated)
                                } else if (updated.length < 5) {
                                  setPortfolioLinks([...updated, { name: 'Website', url: 'https://' }])
                                }
                              }}
                              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                            >
                              + Website
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...portfolioLinks]
                                const index = updated.findIndex(link => link.name === '')
                                if (index !== -1) {
                                  updated[index] = { name: 'Personal', url: 'https://' }
                                  setPortfolioLinks(updated)
                                } else if (updated.length < 5) {
                                  setPortfolioLinks([...updated, { name: 'Personal', url: 'https://' }])
                                }
                              }}
                              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                            >
                              + Personal
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

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
