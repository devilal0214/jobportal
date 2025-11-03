"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft } from 'lucide-react';
import TiptapEditor from '@/components/TiptapEditor';
import Header from '@/components/Header';

export default function NewJobPage() {

interface Form {
  id: string;
  name: string;
  isDefault: boolean;
}

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    position: '',
    description: '',
    status: 'DRAFT',
    formId: ''
  })
  const [availableForms, setAvailableForms] = useState([])

  const entryLevels = [
    'Entry Level',
    'Junior Level',
    'Mid Level',
    'Managerial Level',
    'Senior / Strategic Level',
    'Leadership / C-Suite'
  ]
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }
        
        const response = await fetch('/api/admin/forms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const forms = await response.json()
          setAvailableForms(forms)
          // Set default form if available
          const defaultForm = forms.find((form: Form) => form.isDefault)
          if (defaultForm) {
            setFormData(prev => ({ ...prev, formId: defaultForm.id }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch forms:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchForms()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) 
        {
        const job = await response.json()
        router.push(`/jobs/${job.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create job')
      }
    } catch (error) {
      console.error('Create job error:', error)
      setError('An error occurred while creating the job')
    } finally {
      setSaving(false)
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

  return (
    <>
      <Header 
        title="Create New Job - Job Portal"
        description="Create a new job posting with detailed requirements and application form."
        keywords="create job, job posting, employment, hiring"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Page Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href="/jobs"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New Job</h1>
            <p className="mt-2 text-gray-600">
              Fill out the form below to create a new job opening
            </p>
          </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Job Information</h2>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter job title (e.g., Senior React Developer, Marketing Manager)"
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                Entry Level *
              </label>
              <select
                id="position"
                name="position"
                required
                value={formData.position}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select an entry level</option>
                {entryLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Role *
            </label>
            <div className="mt-1">
              <TiptapEditor
                value={formData.description || ''}
                onChange={(value: string) => setFormData(prev => ({ ...prev, description: value || '' }))}
                placeholder="Enter detailed job description with requirements, responsibilities, and benefits..."
                height={250}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
                Use the toolbar to format your job description with headings, lists, and styling.
            </p>
            </div>

            <div>
              <label htmlFor="formId" className="block text-sm font-medium text-gray-700 mb-2">
                Assign Job Form *
              </label>
              <select
                id="formId"
                name="formId"
                required
                value={formData.formId}
                onChange={(e) => setFormData(prev => ({ ...prev, formId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select application form</option>
                {availableForms.map((form: Form) => (
                  <option key={form.id} value={form.id}>{form.name}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Choose the application form that candidates will fill out for this position. Create <a href="/admin/form-builder" className="text-indigo-600 hover:text-indigo-500">a new form</a>
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Job Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border text-gray-600 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="DRAFT">Draft (Not Published)</option>
                <option value="ACTIVE">Published (Accepting Applications)</option>
                <option value="PAUSED">Paused (Temporarily Closed)</option>
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <Link
              href="/jobs"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Creating...' : 'Create Job'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
