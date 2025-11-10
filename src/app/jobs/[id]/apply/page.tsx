'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, Plus, Trash2, Eye, X } from 'lucide-react'
import TagsInput from '@/components/TagsInput'
import SkillsWithRatings from '@/components/SkillsWithRatings'
import CountryCodeInput from '@/components/CountryCodeInput'

interface FormField {
  id: string
  label: string
  fieldType: string
  placeholder?: string
  options?: string[]
  cssClass?: string
  fieldId?: string
  fieldWidth?: string
  isRequired: boolean
  order: number
}

interface FileData {
  fileName: string
  originalName: string
  path: string
}

interface PortfolioLink {
  name: string
  url: string
}

interface Job {
  id: string
  title: string
  position: string
  form?: {
    id: string
    name: string
    description?: string
    fields: FormField[]
  }
}

export default function JobApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState<Record<string, string | string[]>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([{ name: '', url: '' }])
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [previewFile, setPreviewFile] = useState<{ fieldId: string; fileData: FileData } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const resolvedParams = use(params)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setJob(data)
          
          // Initialize form data with empty values
          if (data.form?.fields) {
            const initialData: Record<string, string | string[]> = {}
            data.form.fields.forEach((field: FormField) => {
              if (field.fieldType === 'TAGS') {
                initialData[field.id] = []
              } else if (field.fieldType === 'SKILLS') {
                initialData[field.id] = JSON.stringify([])
              } else if (field.fieldType === 'CHECKBOX') {
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
    fetchJob()
  }, [resolvedParams.id])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!job?.form?.fields) return errors

    job.form.fields.forEach((field) => {
      if (field.isRequired) {
        const value = formData[field.id]
        
        if (field.fieldType === 'SKILLS') {
          // For skills, check if it's a valid JSON array with at least one skill and all skills are rated
          try {
            const skills = typeof value === 'string' ? JSON.parse(value) : value
            if (!Array.isArray(skills) || skills.length === 0) {
              errors[field.id] = `${field.label} is required`
            } else {
              // Check if all skills have ratings > 0
              const hasUnratedSkills = skills.some(skill => !skill.rating || skill.rating === 0)
              if (hasUnratedSkills) {
                errors[field.id] = `Please rate all skills in ${field.label}`
              }
            }
          } catch {
            errors[field.id] = `${field.label} is required`
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
    
    // Clear previous messages
    setError('')
    setSuccessMessage('')
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setError('Please fix the validation errors above')
      return
    }

    // Prevent multiple submissions
    if (submitting) {
      return
    }

    setSubmitting(true)
    setValidationErrors({})

    try {
      // Include portfolio links in form data
      const submissionData = {
        ...formData,
        portfolioLinks: portfolioLinks.filter(link => link.name.trim() !== '' && link.url.trim() !== '')
      }

      // Create field labels mapping
      const fieldLabels: Record<string, string> = {}
      if (job?.form?.fields) {
        job.form.fields.forEach((field) => {
          fieldLabels[field.id] = field.label
        })
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: resolvedParams.id,
          formData: submissionData,
          fieldLabels
        }),
      })

      if (response.ok) {
        setSuccessMessage('Thank you! Your application has been submitted successfully. We will review your application and get back to you soon.')
        // Clear form data on success
        setFormData({})
        setPortfolioLinks([{ name: '', url: '' }])
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit application. Please try again.')
      }
    } catch (err) {
      console.error('Submission error:', err)
      setError('Network error: Failed to submit application. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateFormData = (fieldId: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }))
    }
  }

  const validateFile = (file: File): string | null => {
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (file.size > maxSize) {
      return 'File size must be less than 2MB'
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, DOC, and DOCX files are allowed'
    }

    return null
  }

  const handleFileUpload = async (fieldId: string, file: File | null) => {
    if (!file) {
      updateFormData(fieldId, '')
      setFileErrors(prev => ({ ...prev, [fieldId]: '' }))
      return
    }

    const error = validateFile(file)
    if (error) {
      setFileErrors(prev => ({ ...prev, [fieldId]: error }))
      return
    }

    setFileErrors(prev => ({ ...prev, [fieldId]: '' }))
    
    try {
      // Upload file to server
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })
      
      if (response.ok) {
        const result = await response.json()
        // Store both the filename and original name for proper linking
        updateFormData(fieldId, JSON.stringify({
          fileName: result.fileName,
          originalName: result.originalName,
          path: result.path
        }))
      } else {
        const errorData = await response.json()
        setFileErrors(prev => ({ ...prev, [fieldId]: errorData.error || 'Upload failed' }))
      }
    } catch (uploadError) {
      console.error('File upload error:', uploadError)
      setFileErrors(prev => ({ ...prev, [fieldId]: 'Upload failed. Please try again.' }))
    }
  }

  const addPortfolioLink = () => {
    if (portfolioLinks.length < 5) {
      setPortfolioLinks(prev => [...prev, { name: '', url: '' }])
    }
  }

  const removePortfolioLink = (index: number) => {
    if (portfolioLinks.length > 1) {
      setPortfolioLinks(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updatePortfolioLink = (index: number, field: 'name' | 'url', value: string) => {
    setPortfolioLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ))
  }

  const handlePreviewFile = (fieldId: string) => {
    const fieldValue = formData[fieldId] as string
    if (fieldValue && fieldValue.startsWith('{')) {
      try {
        const fileData = JSON.parse(fieldValue) as FileData
        setPreviewFile({ fieldId, fileData })
        setShowPreview(true)
      } catch (error) {
        console.error('Error parsing file data:', error)
      }
    }
  }

  const closePreview = () => {
    setShowPreview(false)
    setPreviewFile(null)
  }

  const renderField = (field: FormField) => {
    const fieldValue = formData[field.id] || (field.fieldType === 'TAGS' || field.fieldType === 'CHECKBOX' ? [] : '')
    const hasError = validationErrors[field.id]
    // Enhanced field styling with stronger text colors and better contrast
    const fieldClass = `w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800 placeholder-gray-500 font-medium ${hasError ? 'border-red-500' : 'border-gray-300'} ${field.cssClass || ''}`

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            id={field.fieldId || field.id}
            value={fieldValue}
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
            value={fieldValue}
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
            value={fieldValue}
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
            value={fieldValue}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
            rows={4}
            required={field.isRequired}
          />
        )

      case 'SELECT':
        return (
          <select
            id={field.fieldId || field.id}
            value={fieldValue}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={fieldClass}
            required={field.isRequired}
          >
            <option value="" className="text-gray-600">{field.placeholder || 'Select an option'}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option} className="text-gray-900">
                {option}
              </option>
            ))}
          </select>
        )

      case 'RADIO':
        return (
          <div className={`space-y-3 ${field.cssClass || ''}`} id={field.fieldId || field.id}>
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={fieldValue === option}
                  onChange={(e) => updateFormData(field.id, e.target.value)}
                  className="mr-3 w-4 h-4 text-indigo-600"
                  required={field.isRequired}
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'CHECKBOX':
        return (
          <div className={`space-y-3 ${field.cssClass || ''}`} id={field.fieldId || field.id}>
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={fieldValue.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateFormData(field.id, [...(fieldValue as string[]), option])
                    } else {
                      updateFormData(field.id, (fieldValue as string[]).filter((v: string) => v !== option))
                    }
                  }}
                  className="mr-3 w-4 h-4 text-indigo-600"
                />
                <span className="text-gray-900">{option}</span>
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

      case 'SKILLS':
        return (
          <SkillsWithRatings
            value={typeof fieldValue === 'string' && fieldValue.startsWith('[') 
              ? JSON.parse(fieldValue) 
              : Array.isArray(fieldValue) 
                ? fieldValue 
                : []
            }
            onChange={(skillRatings) => updateFormData(field.id, JSON.stringify(skillRatings))}
            options={field.options || []}
            placeholder={field.placeholder || 'Type to add skills...'}
            className={field.cssClass || ''}
            id={field.fieldId || field.id}
          />
        )

      case 'COUNTRY_CODE':
        return (
          <CountryCodeInput
            id={field.fieldId || field.id}
            value={fieldValue as string}
            onChange={(value) => updateFormData(field.id, value)}
            required={field.isRequired}
            className={field.cssClass || ''}
          />
        )

      case 'FILE':
        return (
          <div className={`space-y-2 ${field.cssClass || ''}`} id={field.fieldId || field.id}>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-indigo-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor={`file-${field.id}`} className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {field.placeholder || 'Choose file to upload'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 block">
                    PDF, DOC, DOCX (Max 2MB)
                  </span>
                  <input
                    id={`file-${field.id}`}
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      handleFileUpload(field.id, file)
                    }}
                    required={field.isRequired}
                  />
                </label>
                {fieldValue && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-green-600">
                      Selected: {
                        typeof fieldValue === 'string' && fieldValue.startsWith('{')
                          ? JSON.parse(fieldValue).originalName
                          : fieldValue
                      }
                    </p>
                    {typeof fieldValue === 'string' && fieldValue.startsWith('{') && (
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(field.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview Resume
                      </button>
                    )}
                  </div>
                )}
                {fileErrors[field.id] && (
                  <p className="text-sm text-red-600 mt-2">
                    {fileErrors[field.id]}
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 'URL':
        return (
          <input
            type="url"
            id={field.fieldId || field.id}
            value={fieldValue}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
            required={field.isRequired}
          />
        )

      case 'DATE':
        return (
          <input
            type="date"
            id={field.fieldId || field.id}
            value={fieldValue}
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
            value={fieldValue}
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
            value={fieldValue}
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Job not found.'}</p>
          <Link href="/jobs" className="text-indigo-600 hover:text-indigo-500">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  if (!job.form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Application Form</h2>
          <p className="text-gray-600 mb-4">This job doesn&apos;t have an application form configured.</p>
          <Link href={`/jobs/${job.id}`} className="text-indigo-600 hover:text-indigo-500">
            Back to Job Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href={`/jobs/${job.id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Details
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h1>
            <p className="text-gray-600 mt-1">{job.position}</p>
          </div>

          {job.form.description && (
            <div className="mb-6 p-4 bg-blue-50 rounded-md">
              <p className="text-blue-800">{job.form.description}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-green-800 mb-2">Application Submitted Successfully!</h3>
                  <p className="text-green-700 mb-4">{successMessage}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessMessage('')
                      setError('')
                      setFormData({})
                      setPortfolioLinks([{ name: '', url: '' }])
                      setValidationErrors({})
                    }}
                    className="bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800 mb-2">Submission Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-12 gap-4 items-start">
              {job.form.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => {
                  // Parse options if they are JSON strings
                  const parsedField = {
                    ...field,
                    options: field.options ? 
                      (typeof field.options === 'string' ? 
                        ((field.options as string).startsWith('[') ? JSON.parse(field.options as string) : [field.options]) 
                        : field.options
                      ) : []
                  }

                  // Convert percentage width to grid columns
                  const getGridCols = (width: string) => {
                    switch (width) {
                      case '25%': return 'col-span-3'
                      case '33%': return 'col-span-4' 
                      case '50%': return 'col-span-6'
                      case '66%': return 'col-span-8'
                      case '75%': return 'col-span-9'
                      case '100%': 
                      default: return 'col-span-12'
                    }
                  }
                  
                  return (
                    <div 
                      key={field.id} 
                      className={`space-y-2 ${getGridCols(field.fieldWidth || '100%')}`}
                    >
                      <label className="block text-sm font-medium text-gray-900">
                        {field.label}
                        {field.isRequired && <span className="text-red-600 ml-1">*</span>}
                      </label>
                      
                      {renderField(parsedField)}
                      
                      {validationErrors[field.id] && (
                        <p className="text-red-600 text-sm">{validationErrors[field.id]}</p>
                      )}
                    </div>
                  )
                })}
            </div>

            {/* Portfolio Links Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Links (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add up to 5 portfolio links to showcase your work.
              </p>
              <div className="space-y-4">
                {portfolioLinks.map((link, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Platform/Type
                          </label>
                          <input
                            type="text"
                            value={link.name}
                            onChange={(e) => updatePortfolioLink(index, 'name', e.target.value)}
                            placeholder="e.g., GitHub, LinkedIn, Behance, Personal Website"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL
                          </label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updatePortfolioLink(index, 'url', e.target.value)}
                            placeholder={`https://example.com/your-profile`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                          />
                        </div>
                      </div>
                      {portfolioLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors mt-6"
                          title="Remove link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {portfolioLinks.length < 5 && (
                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Portfolio Link
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting || !!successMessage}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Application...
                  </span>
                ) : successMessage ? (
                  'Application Submitted ✓'
                ) : (
                  'Submit Application'
                )}
              </button>
              <Link
                href={`/jobs/${job.id}`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Resume Preview - {previewFile.fileData.originalName}
              </h3>
              <button
                onClick={closePreview}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-4 overflow-hidden">
              {previewFile.fileData.originalName.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`/api/files/${previewFile.fileData.fileName}`}
                  className="w-full h-full border rounded"
                  title="Resume Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="text-center">
                    <Upload className="mx-auto h-16 w-16 text-gray-400" />
                    <h4 className="mt-4 text-lg font-medium text-gray-900">
                      Preview Not Available
                    </h4>
                    <p className="mt-2 text-sm text-gray-500">
                      Preview is only available for PDF files. Your {previewFile.fileData.originalName.split('.').pop()?.toUpperCase()} file has been uploaded successfully.
                    </p>
                    <a
                      href={`/api/files/${previewFile.fileData.fileName}`}
                      download={previewFile.fileData.originalName}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
