'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Save, 
  Upload, 
  X, 
  Plus, 
  Trash2,
  Image as ImageIcon,
  Menu as MenuIcon,
  Type
} from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  url: string
  order: number
}

interface CareersSettings {
  bannerImage?: string
  bannerTitle: string
  bannerSubtitle: string
  bannerDescription: string
  bannerOverlay: string
  bannerHeight: string
  bannerWidth: string
  bannerBorderRadius: string
  titleColor: string
  titleFontSize: string
  subtitleColor: string
  subtitleFontSize: string
  descriptionColor: string
  descriptionFontSize: string
  logoImage?: string
  logoHeight: string
  logoWidth: string
  companyName: string
  menuItems: MenuItem[]
}

export default function CareersSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<CareersSettings>({
    bannerTitle: 'Careers at JV',
    bannerSubtitle: 'Explore Our Job Openings and Start Your Exciting Career with Us',
    bannerDescription: 'We are a fast-growing creative marketing agency looking for talented and passionate individuals to join our team. If you have strong communication skills, a creative portfolio, and a positive attitude, we would be excited to hear from you.',
    bannerOverlay: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
    bannerHeight: '400px',
    bannerWidth: '100%',
    bannerBorderRadius: '0px',
    titleColor: '#ffffff',
    titleFontSize: '48px',
    subtitleColor: '#ffffff',
    subtitleFontSize: '24px',
    descriptionColor: '#f3f4f6',
    descriptionFontSize: '16px',
    logoHeight: '40px',
    logoWidth: '40px',
    companyName: 'Job Portal',
    menuItems: []
  })

  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [logoPreview, setLogoPreview] = useState<string>('')

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) {
          localStorage.removeItem('token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }

    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/admin/careers-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.settings) {
            setSettings(data.settings)
            if (data.settings.bannerImage) {
              setBannerPreview(data.settings.bannerImage)
            }
            if (data.settings.logoImage) {
              setLogoPreview(data.settings.logoImage)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    fetchSettings()
  }, [router])

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      label: '',
      url: '',
      order: settings.menuItems.length
    }
    setSettings({
      ...settings,
      menuItems: [...settings.menuItems, newItem]
    })
  }

  const updateMenuItem = (id: string, field: 'label' | 'url', value: string) => {
    setSettings({
      ...settings,
      menuItems: settings.menuItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    })
  }

  const deleteMenuItem = (id: string) => {
    setSettings({
      ...settings,
      menuItems: settings.menuItems.filter(item => item.id !== id)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()

      // Add text settings
      formData.append('bannerTitle', settings.bannerTitle)
      formData.append('bannerSubtitle', settings.bannerSubtitle)
      formData.append('bannerDescription', settings.bannerDescription)
      formData.append('bannerOverlay', settings.bannerOverlay)
      formData.append('bannerHeight', settings.bannerHeight)
      formData.append('bannerWidth', settings.bannerWidth)
      formData.append('bannerBorderRadius', settings.bannerBorderRadius)
      formData.append('titleColor', settings.titleColor)
      formData.append('titleFontSize', settings.titleFontSize)
      formData.append('subtitleColor', settings.subtitleColor)
      formData.append('subtitleFontSize', settings.subtitleFontSize)
      formData.append('descriptionColor', settings.descriptionColor)
      formData.append('descriptionFontSize', settings.descriptionFontSize)
      formData.append('logoHeight', settings.logoHeight)
      formData.append('logoWidth', settings.logoWidth)
      formData.append('companyName', settings.companyName)
      formData.append('menuItems', JSON.stringify(settings.menuItems))

      // Add images if selected
      if (bannerImageFile) {
        formData.append('bannerImage', bannerImageFile)
      }
      if (logoImageFile) {
        formData.append('logoImage', logoImageFile)
      }

      const response = await fetch('/api/admin/careers-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        alert('Settings saved successfully!')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Failed to save settings: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Careers Page Settings</h1>
          <p className="text-gray-600">Customize your public careers page appearance and content</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Logo & Company Name */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <ImageIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Logo & Branding</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex items-start space-x-4">
                  {logoPreview && (
                    <div className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-contain"
                      />
                      <button
                        onClick={() => {
                          setLogoPreview('')
                          setLogoImageFile(null)
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="Enter company name"
                />
              </div>

              {/* Logo Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Height
                  </label>
                  <input
                    type="text"
                    value={settings.logoHeight}
                    onChange={(e) => setSettings({ ...settings, logoHeight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="e.g., 40px, 3rem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Width
                  </label>
                  <input
                    type="text"
                    value={settings.logoWidth}
                    onChange={(e) => setSettings({ ...settings, logoWidth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="e.g., 40px, 3rem"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Banner Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Type className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Banner Content</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Background Image
                </label>
                <div className="mb-4">
                  {bannerPreview && (
                    <div className="relative w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden mb-2">
                      <Image
                        src={bannerPreview}
                        alt="Banner preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => {
                          setBannerPreview('')
                          setBannerImageFile(null)
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Banner Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Title
                </label>
                <input
                  type="text"
                  value={settings.bannerTitle}
                  onChange={(e) => setSettings({ ...settings, bannerTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="e.g., Careers at JV"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={settings.bannerSubtitle}
                  onChange={(e) => setSettings({ ...settings, bannerSubtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="Enter subtitle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.bannerDescription}
                  onChange={(e) => setSettings({ ...settings, bannerDescription: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="Enter description"
                />
              </div>

              {/* Banner Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Height
                  </label>
                  <input
                    type="text"
                    value={settings.bannerHeight}
                    onChange={(e) => setSettings({ ...settings, bannerHeight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="e.g., 400px or 50vh"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Width
                  </label>
                  <input
                    type="text"
                    value={settings.bannerWidth}
                    onChange={(e) => setSettings({ ...settings, bannerWidth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="e.g., 100% or 1200px"
                  />
                </div>
              </div>

              {/* Banner Border Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Border Radius
                </label>
                <input
                  type="text"
                  value={settings.bannerBorderRadius}
                  onChange={(e) => setSettings({ ...settings, bannerBorderRadius: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="e.g., 0px, 8px, 16px, 24px"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Set corner roundness. Use 0px for sharp corners, 8px-24px for rounded corners.
                </p>
              </div>

              {/* Banner Overlay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Overlay (CSS)
                </label>
                <input
                  type="text"
                  value={settings.bannerOverlay}
                  onChange={(e) => setSettings({ ...settings, bannerOverlay: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-mono text-sm"
                  placeholder="e.g., linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use CSS gradient or solid color. Examples: linear-gradient(...), rgba(0,0,0,0.5), #000000
                </p>
              </div>

              {/* Title Styling */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Title Styling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.titleColor}
                        onChange={(e) => setSettings({ ...settings, titleColor: e.target.value })}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.titleColor}
                        onChange={(e) => setSettings({ ...settings, titleColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-mono text-sm"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title Font Size
                    </label>
                    <input
                      type="text"
                      value={settings.titleFontSize}
                      onChange={(e) => setSettings({ ...settings, titleFontSize: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="e.g., 48px or 3rem"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle Styling */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Subtitle Styling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtitle Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.subtitleColor}
                        onChange={(e) => setSettings({ ...settings, subtitleColor: e.target.value })}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.subtitleColor}
                        onChange={(e) => setSettings({ ...settings, subtitleColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-mono text-sm"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtitle Font Size
                    </label>
                    <input
                      type="text"
                      value={settings.subtitleFontSize}
                      onChange={(e) => setSettings({ ...settings, subtitleFontSize: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="e.g., 24px or 1.5rem"
                    />
                  </div>
                </div>
              </div>

              {/* Description Styling */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Description Styling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.descriptionColor}
                        onChange={(e) => setSettings({ ...settings, descriptionColor: e.target.value })}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.descriptionColor}
                        onChange={(e) => setSettings({ ...settings, descriptionColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-mono text-sm"
                        placeholder="#f3f4f6"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description Font Size
                    </label>
                    <input
                      type="text"
                      value={settings.descriptionFontSize}
                      onChange={(e) => setSettings({ ...settings, descriptionFontSize: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="e.g., 16px or 1rem"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Menu Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MenuIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Navigation Menu</h2>
              </div>
              <button
                onClick={addMenuItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Menu Item
              </button>
            </div>

            <div className="space-y-3">
              {settings.menuItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No menu items added yet</p>
              ) : (
                settings.menuItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateMenuItem(item.id, 'label', e.target.value)}
                        placeholder="Menu Label"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2 text-gray-900"
                      />
                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) => updateMenuItem(item.id, 'url', e.target.value)}
                        placeholder="URL (e.g., /about or https://example.com)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                      />
                    </div>
                    <button
                      onClick={() => deleteMenuItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
