'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Eye, 
  Move, 
  Type, 
  Mail, 
  Phone, 
  Calendar,
  Hash,
  List,
  CheckSquare,
  FileText,
  Tags,
  LogOut,
  Settings,
  Upload,
  Link as LinkIcon,
  Briefcase,
  ChevronDown,
  FormInput
} from 'lucide-react'
import TagsInput from '@/components/TagsInput'
import { User } from '@/types/user'

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
  fieldWidth?: string // New field for width configuration (25%, 50%, 75%, 100%)
}

interface Form {
  id: string
  name: string
  description?: string
  isDefault: boolean
  fields: FormField[]
}

interface FieldType {
  type: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  defaultPlaceholder: string
}

const FIELD_TYPES: FieldType[] = [
  { type: 'TEXT', label: 'Text Input', icon: Type, defaultPlaceholder: 'Enter text...' },
  { type: 'EMAIL', label: 'Email', icon: Mail, defaultPlaceholder: 'Enter email...' },
  { type: 'PHONE', label: 'Phone', icon: Phone, defaultPlaceholder: 'Enter phone number...' },
  { type: 'TEXTAREA', label: 'Text Area', icon: FileText, defaultPlaceholder: 'Enter details...' },
  { type: 'SELECT', label: 'Dropdown', icon: List, defaultPlaceholder: 'Select an option...' },
  { type: 'RADIO', label: 'Radio Buttons', icon: CheckSquare, defaultPlaceholder: '' },
  { type: 'CHECKBOX', label: 'Checkboxes', icon: CheckSquare, defaultPlaceholder: '' },
  { type: 'DATE', label: 'Date Picker', icon: Calendar, defaultPlaceholder: '' },
  { type: 'NUMBER', label: 'Number', icon: Hash, defaultPlaceholder: 'Enter number...' },
  { type: 'TAGS', label: 'Tags', icon: Tags, defaultPlaceholder: 'Type to add tags...' },
  { type: 'SKILLS', label: 'Skills with Ratings', icon: Tags, defaultPlaceholder: 'Select skills and rate your expertise...' },
  { type: 'FILE', label: 'File Upload', icon: Upload, defaultPlaceholder: 'Choose file...' },
  { type: 'URL', label: 'URL/Link', icon: LinkIcon, defaultPlaceholder: 'Enter URL...' }
]

function FormBuilderContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [forms, setForms] = useState<Form[]>([])
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [fields, setFields] = useState<FormField[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [draggedField, setDraggedField] = useState<FormField | null>(null)
  const [draggedFieldType, setDraggedFieldType] = useState<FieldType | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const fetchForms = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/forms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setForms(data)
        
        // Auto-load form if editId parameter is present
        const editId = searchParams.get('editId')
        if (editId) {
          const formToEdit = data.find((form: Form) => form.id === editId)
          if (formToEdit) {
            selectForm(formToEdit)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
    }
  }, [searchParams])

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          if (userData.role?.name !== 'Administrator') {
            router.push('/admin')
            return
          }
          setUser(userData)
          await fetchForms()
        } else {
          localStorage.removeItem('token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, searchParams, fetchForms])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showJobsDropdown) {
        const target = event.target as Element
        if (!target.closest('.relative')) {
          setShowJobsDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showJobsDropdown])

  const selectForm = (form: Form) => {
    setSelectedForm(form)
    setFormName(form.name)
    setFormDescription(form.description || '')
    setIsDefault(form.isDefault)
    
    // Parse options from JSON strings back to arrays when loading form
    const parsedFields = form.fields.map(field => ({
      ...field,
      options: field.options ? 
        (typeof field.options === 'string' ? 
          ((field.options as string).startsWith('[') ? JSON.parse(field.options as string) : [field.options]) 
          : field.options
        ) : []
    }))
    
    setFields(parsedFields.sort((a, b) => a.order - b.order))
    setError('')
    setSuccess('')
  }

  const createNewForm = () => {
    setSelectedForm(null)
    setFormName('')
    setFormDescription('')
    setIsDefault(false)
    setFields([])
    setError('')
    setSuccess('')
  }

  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  const removeField = (fieldId: string) => {
    const newFields = fields.filter(field => field.id !== fieldId)
    const reorderedFields = newFields.map((field, index) => ({ ...field, order: index }))
    setFields(reorderedFields)
  }

  const handleDragStart = (e: React.DragEvent, field: FormField | null, fieldType: FieldType | null) => {
    if (field) {
      setDraggedField(field)
      e.dataTransfer.setData('text/plain', 'existing-field')
    } else if (fieldType) {
      setDraggedFieldType(fieldType)
      e.dataTransfer.setData('text/plain', 'new-field')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const dataType = e.dataTransfer.getData('text/plain')

    if (dataType === 'new-field' && draggedFieldType) {
      const newField: FormField = {
        id: generateFieldId(),
        label: `${draggedFieldType.label} Field`,
        fieldType: draggedFieldType.type,
        placeholder: draggedFieldType.defaultPlaceholder,
        options: ['SELECT', 'RADIO', 'CHECKBOX', 'TAGS'].includes(draggedFieldType.type) ? ['Option 1', 'Option 2', 'Option 3'] : [],
        cssClass: '',
        fieldId: '',
        isRequired: false,
        order: targetIndex,
        fieldWidth: '100%' // Default to full width
      }

      const newFields = [...fields]
      newFields.splice(targetIndex, 0, newField)
      const reorderedFields = newFields.map((field, index) => ({ ...field, order: index }))
      setFields(reorderedFields)
      setDraggedFieldType(null)
    } else if (dataType === 'existing-field' && draggedField) {
      const newFields = [...fields]
      const draggedIndex = newFields.findIndex(f => f.id === draggedField.id)
      
      if (draggedIndex !== -1) {
        newFields.splice(draggedIndex, 1)
        newFields.splice(targetIndex > draggedIndex ? targetIndex - 1 : targetIndex, 0, draggedField)
        const reorderedFields = newFields.map((field, index) => ({ ...field, order: index }))
        setFields(reorderedFields)
      }
      setDraggedField(null)
    }
  }

  const saveForm = async () => {
    if (!formName.trim()) {
      setError('Form name is required')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required. Please log in again.')
        router.push('/login')
        return
      }

      const url = selectedForm ? `/api/admin/forms/${selectedForm.id}` : '/api/admin/forms'
      const method = selectedForm ? 'PUT' : 'POST'

      console.log('Saving form:', { name: formName, fields })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          isDefault,
          fields: fields.map((field, index) => ({ ...field, order: index }))
        })
      })

      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Response text:', responseText)

      if (response.ok) {
        let savedForm
        try {
          savedForm = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Failed to parse response:', parseError)
          setError('Invalid response from server')
          return
        }
        
        setSuccess(selectedForm ? 'Form updated successfully!' : 'Form created successfully!')
        await fetchForms()
        
        if (!selectedForm) {
          selectForm(savedForm)
        }
      } else {
        if (responseText.includes('<!DOCTYPE')) {
          setError('Server error: Please check if you have admin permissions and try again.')
        } else {
          try {
            const data = JSON.parse(responseText)
            setError(data.error || 'Failed to save form')
          } catch {
            setError('Failed to save form: ' + response.status)
          }
        }
      }
    } catch (error) {
      console.error('Save form error:', error)
      setError('An error occurred while saving the form')
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field: FormField) => {
    // Improved styling with darker colors for better visibility
    const fieldClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 text-gray-900 placeholder-gray-600 ${field.cssClass || ''}`

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        )

      case 'EMAIL':
        return (
          <input
            type="email"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        )

      case 'PHONE':
        return (
          <input
            type="tel"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        )

      case 'TEXTAREA':
        return (
          <textarea
            placeholder={field.placeholder}
            className={fieldClass}
            rows={3}
            id={field.fieldId || `field-${field.id}`}
          />
        )

      case 'SELECT':
        return (
          <select className={fieldClass} id={field.fieldId || `field-${field.id}`}>
            <option value="" className="text-gray-600">{field.placeholder || 'Select an option'}</option>
            {Array.isArray(field.options) && field.options.map((option, index) => (
              <option key={index} value={option} className="text-gray-900">
                {option}
              </option>
            ))}
          </select>
        )

      case 'RADIO':
        return (
          <div className={`space-y-2 ${field.cssClass || ''}`} id={field.fieldId || `field-${field.id}`}>
            {Array.isArray(field.options) && field.options.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={field.fieldId || field.id}
                  value={option}
                  className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-800">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'CHECKBOX':
        return (
          <div className={`space-y-2 ${field.cssClass || ''}`} id={field.fieldId || `field-${field.id}`}>
            {Array.isArray(field.options) && field.options.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-800">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'TAGS':
        return (
          <TagsInput
            value={[]}
            onChange={() => {}}
            options={Array.isArray(field.options) ? field.options : []}
            placeholder={field.placeholder || 'Type to add tags...'}
            className={field.cssClass || ''}
            id={field.fieldId || `field-${field.id}`}
          />
        )

      case 'SKILLS':
        return (
          <div className={`${field.cssClass || ''}`} id={field.fieldId || `field-${field.id}`}>
            <div className="text-sm text-gray-600 mb-3">
              {field.placeholder || 'Select skills and rate your expertise...'}
            </div>
            <div className="space-y-3">
              <div className="text-xs text-gray-500">
                Skills with ratings will appear here when skills are selected
              </div>
            </div>
          </div>
        )

      case 'DATE':
        return (
          <input
            type="date"
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        )

      case 'NUMBER':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        )

      case 'FILE':
        return (
          <div className={`border-2 border-dashed border-gray-300 rounded-md p-6 text-center ${field.cssClass || ''}`} id={field.fieldId || `field-${field.id}`}>
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-900">
                {field.placeholder || 'Choose file to upload'}
              </span>
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 2MB)</p>
            </div>
          </div>
        )

      case 'URL':
        return (
          <input
            type="url"
            placeholder={field.placeholder || 'Enter URL...'}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        )

      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        )
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      router.push('/login')
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                Job Portal
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <div className="relative">
                <button
                  onClick={() => setShowJobsDropdown(!showJobsDropdown)}
                  className="text-gray-700 hover:text-gray-900 flex items-center space-x-1 focus:outline-none"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Jobs</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showJobsDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        href="/jobs"
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => setShowJobsDropdown(false)}
                      >
                        <Briefcase className="h-4 w-4" />
                        <span>View All Jobs</span>
                      </Link>
                      <Link
                        href="/jobs/new"
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => setShowJobsDropdown(false)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Job</span>
                      </Link>
                      <Link
                        href="/admin/form-builder"
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => setShowJobsDropdown(false)}
                      >
                        <FormInput className="h-4 w-4" />
                        <span>Create Form</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/applications" className="text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>Applications</span>
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user.name} ({user.role?.name || 'Guest'})
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
          <p className="mt-2 text-gray-600">
            Create and manage application forms with drag and drop functionality
          </p>
        </div>

        {/* Main Layout - Left and Right Columns */}
        <div className="flex gap-6">
          {/* Left Sidebar - Fixed Width and Sticky */}
          <div className="w-80 flex-shrink-0 space-y-6 sticky top-6 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
            {/* Forms List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Forms</h2>
                  <button
                    onClick={createNewForm}
                    className="p-1 text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 rounded"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {forms.map((form) => (
                    <div
                      key={form.id}
                      onClick={() => selectForm(form)}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedForm?.id === form.id
                          ? 'bg-indigo-50 border-indigo-200 border text-indigo-900'
                          : 'hover:bg-gray-50 border border-transparent text-gray-900'
                      }`}
                    >
                      <div className="font-medium">{form.name}</div>
                      <div className="text-sm text-gray-500">{form.fields.length} fields</div>
                      {form.isDefault && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-1">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                  {forms.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No forms created yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Field Types */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Field Types</h3>
                <p className="text-sm text-gray-500 mt-1">Drag fields to the form area</p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {FIELD_TYPES.map((fieldType) => {
                    const Icon = fieldType.icon
                    return (
                      <div
                        key={fieldType.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, null, fieldType)}
                        className="flex items-center p-3 bg-gray-50 rounded-md cursor-move hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <Icon className="h-4 w-4 text-gray-600 mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">{fieldType.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Content - Flexible Width */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow">
              {/* Form Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Form Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter form name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Form description (optional)"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Set as default form</span>
                  </label>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </button>
                    <button
                      onClick={saveForm}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Form'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                    {success}
                  </div>
                )}
              </div>

              {/* Form Content */}
              <div className="p-6">
                {showPreview ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Form Preview</h3>
                      <span className="text-sm text-gray-500">How applicants will see the form</span>
                    </div>
                    <div className="max-w-2xl">
                      <div className="grid grid-cols-12 gap-4">
                        {fields.map((field) => {
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
                              <label className="block text-sm font-medium text-gray-800">
                                {field.label}
                                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {renderField(field)}
                            </div>
                          )
                        })}
                      </div>
                      {fields.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-gray-500">
                            No fields added yet. Switch to build mode to add fields.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Form Builder</h3>
                      <span className="text-sm text-gray-500">Drag field types from the left to build your form</span>
                    </div>
                    
                    {/* Drop Zone */}
                    <div
                      className="min-h-[500px] border-2 border-dashed border-gray-300 rounded-lg p-6"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, fields.length)}
                    >
                      {fields.length === 0 ? (
                        <div className="text-center py-20">
                          <div className="text-gray-400 mb-4">
                            <Move className="h-16 w-16 mx-auto" />
                          </div>
                          <p className="text-gray-500 text-lg">
                            Drag field types here to start building your form
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Fields will appear here as you add them
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div
                              key={field.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, field, null)}
                              className="bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index)}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                  <Move className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="font-medium text-gray-900">{field.label}</span>
                                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    {field.fieldType}
                                  </span>
                                  {field.isRequired && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeField(field.id)}
                                  className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Field Label
                                  </label>
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Placeholder Text
                                  </label>
                                  <input
                                    type="text"
                                    value={field.placeholder || ''}
                                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-4 mb-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    CSS Class
                                  </label>
                                  <input
                                    type="text"
                                    value={field.cssClass || ''}
                                    onChange={(e) => updateField(field.id, { cssClass: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                    placeholder="custom-class"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Field ID
                                  </label>
                                  <input
                                    type="text"
                                    value={field.fieldId || ''}
                                    onChange={(e) => updateField(field.id, { fieldId: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                    placeholder="field-id"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Field Width
                                  </label>
                                  <select
                                    value={field.fieldWidth || '100%'}
                                    onChange={(e) => updateField(field.id, { fieldWidth: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800"
                                  >
                                    <option value="25%">25% (1/4 width)</option>
                                    <option value="33%">33% (1/3 width)</option>
                                    <option value="50%">50% (1/2 width)</option>
                                    <option value="66%">66% (2/3 width)</option>
                                    <option value="75%">75% (3/4 width)</option>
                                    <option value="100%">100% (Full width)</option>
                                  </select>
                                </div>
                                <div className="flex items-center pt-5">
                                  <label className="flex items-center text-xs">
                                    <input
                                      type="checkbox"
                                      checked={field.isRequired}
                                      onChange={(e) => updateField(field.id, { isRequired: e.target.checked })}
                                      className="mr-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-700">Required field</span>
                                  </label>
                                </div>
                              </div>

                              {['SELECT', 'RADIO', 'CHECKBOX', 'TAGS', 'SKILLS'].includes(field.fieldType) && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Options (one per line)
                                  </label>
                                  <textarea
                                    value={Array.isArray(field.options) ? field.options.join('\n') : ''}
                                    onChange={(e) => updateField(field.id, { 
                                      options: e.target.value.split('\n').filter(option => option.trim()) 
                                    })}
                                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                    rows={4}
                                    placeholder="Option 1
Option 2
Option 3"
                                    style={{ resize: 'vertical', lineHeight: '1.5' }}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    {field.fieldType === 'TAGS' ? 'These will be available as predefined tag options' : 'Add one option per line'}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Drop zone at the end */}
                          <div
                            className="h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-gray-300 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, fields.length)}
                          >
                            <span className="text-sm">Drop field here to add at the end</span>
                          </div>
                        </div>
                      )}
                    </div>
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

const FormBuilderPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormBuilderContent />
    </Suspense>
  )
}

export default FormBuilderPage
