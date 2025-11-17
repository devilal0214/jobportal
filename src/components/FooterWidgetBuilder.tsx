'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Image as ImageIcon, Type, Menu as MenuIcon, Code, Share2 } from 'lucide-react'

interface FooterWidget {
  id: string
  type: 'logo' | 'text' | 'menu' | 'html' | 'social'
  title?: string
  content: string
  menuItems?: Array<{ label: string; url: string }>
  logoImage?: string
  logoWidth?: string
  logoHeight?: string
  twoColumns?: boolean
  customClass?: string
  order: number
  columnIndex: number
}

interface Props {
  columns: number
  widgets: FooterWidget[]
  onChange: (widgets: FooterWidget[]) => void
  onLogoUpload: (widgetId: string, file: File) => void
}

export default function FooterWidgetBuilder({ columns, widgets, onChange, onLogoUpload }: Props) {
  const [draggedWidget, setDraggedWidget] = useState<FooterWidget | null>(null)
  const [editingWidget, setEditingWidget] = useState<string | null>(null)

  const addWidget = (columnIndex: number, type: FooterWidget['type']) => {
    const newWidget: FooterWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: type === 'menu' ? 'Quick Links' : type === 'text' ? 'About Us' : '',
      content: type === 'text' ? 'Enter your content here...' : type === 'html' ? '<p>Custom HTML here</p>' : '',
      menuItems: type === 'menu' ? [{ label: 'Home', url: '/' }] : undefined,
      logoWidth: type === 'logo' ? '150px' : undefined,
      logoHeight: type === 'logo' ? '50px' : undefined,
      twoColumns: false,
      order: widgets.filter(w => w.columnIndex === columnIndex).length,
      columnIndex
    }
    onChange([...widgets, newWidget])
  }

  const removeWidget = (widgetId: string) => {
    onChange(widgets.filter(w => w.id !== widgetId))
  }

  const updateWidget = (widgetId: string, updates: Partial<FooterWidget>) => {
    onChange(widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w))
  }

  const handleDragStart = (widget: FooterWidget) => {
    setDraggedWidget(widget)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetColumnIndex: number) => {
    if (!draggedWidget) return
    
    const updatedWidgets = widgets.map(w => {
      if (w.id === draggedWidget.id) {
        return { ...w, columnIndex: targetColumnIndex }
      }
      return w
    })
    
    onChange(updatedWidgets)
    setDraggedWidget(null)
  }

  const addMenuItem = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId)
    if (!widget || widget.type !== 'menu') return
    
    const newMenuItems = [...(widget.menuItems || []), { label: 'New Link', url: '#' }]
    updateWidget(widgetId, { menuItems: newMenuItems })
  }

  const updateMenuItem = (widgetId: string, index: number, field: 'label' | 'url', value: string) => {
    const widget = widgets.find(w => w.id === widgetId)
    if (!widget || widget.type !== 'menu') return
    
    const newMenuItems = [...(widget.menuItems || [])]
    newMenuItems[index] = { ...newMenuItems[index], [field]: value }
    updateWidget(widgetId, { menuItems: newMenuItems })
  }

  const removeMenuItem = (widgetId: string, index: number) => {
    const widget = widgets.find(w => w.id === widgetId)
    if (!widget || widget.type !== 'menu') return
    
    const newMenuItems = (widget.menuItems || []).filter((_, i) => i !== index)
    updateWidget(widgetId, { menuItems: newMenuItems })
  }

  const getColumnWidgets = (columnIndex: number) => {
    return widgets.filter(w => w.columnIndex === columnIndex).sort((a, b) => a.order - b.order)
  }

  const renderWidget = (widget: FooterWidget) => {
    const isEditing = editingWidget === widget.id

    return (
      <div
        key={widget.id}
        draggable
        onDragStart={() => handleDragStart(widget)}
        className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-3 hover:border-indigo-400 transition-colors cursor-move"
      >
        {/* Widget Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase">
              {widget.type === 'logo' && '📷 Logo'}
              {widget.type === 'text' && '📝 Text'}
              {widget.type === 'menu' && '📋 Menu'}
              {widget.type === 'html' && '💻 HTML'}
              {widget.type === 'social' && '🔗 Social'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingWidget(isEditing ? null : widget.id)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
            <button
              onClick={() => removeWidget(widget.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Widget Content */}
        {isEditing ? (
          <div className="space-y-3">
            {/* Logo Widget */}
            {widget.type === 'logo' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Upload Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onLogoUpload(widget.id, file)
                    }}
                    className="text-xs w-full"
                  />
                  {widget.logoImage && (
                    <img src={widget.logoImage} alt="Logo" className="mt-2 max-h-16" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                    <input
                      type="text"
                      value={widget.logoWidth || ''}
                      onChange={(e) => updateWidget(widget.id, { logoWidth: e.target.value })}
                      placeholder="150px"
                      className="text-xs w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                    <input
                      type="text"
                      value={widget.logoHeight || ''}
                      onChange={(e) => updateWidget(widget.id, { logoHeight: e.target.value })}
                      placeholder="50px"
                      className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom CSS Class</label>
                  <input
                    type="text"
                    value={widget.customClass || ''}
                    onChange={(e) => updateWidget(widget.id, { customClass: e.target.value })}
                    placeholder="custom-logo-widget"
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
              </>
            )}

            {/* Text Widget */}
            {widget.type === 'text' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={widget.title || ''}
                    onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={widget.content}
                    onChange={(e) => updateWidget(widget.id, { content: e.target.value })}
                    rows={4}
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom CSS Class</label>
                  <input
                    type="text"
                    value={widget.customClass || ''}
                    onChange={(e) => updateWidget(widget.id, { customClass: e.target.value })}
                    placeholder="custom-text-widget"
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
              </>
            )}

            {/* Menu Widget */}
            {widget.type === 'menu' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Menu Title</label>
                  <input
                    type="text"
                    value={widget.title || ''}
                    onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={widget.twoColumns || false}
                      onChange={(e) => updateWidget(widget.id, { twoColumns: e.target.checked })}
                      className="rounded"
                    />
                    Show in Two Columns
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">Menu Items</label>
                  {(widget.menuItems || []).map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => updateMenuItem(widget.id, index, 'label', e.target.value)}
                          placeholder="Label"
                          className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                        />
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => updateMenuItem(widget.id, index, 'url', e.target.value)}
                          placeholder="URL"
                          className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                        />
                      </div>
                      <button
                        onClick={() => removeMenuItem(widget.id, index)}
                        className="text-red-600 hover:text-red-800 mt-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addMenuItem(widget.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Link
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom CSS Class</label>
                  <input
                    type="text"
                    value={widget.customClass || ''}
                    onChange={(e) => updateWidget(widget.id, { customClass: e.target.value })}
                    placeholder="custom-menu-widget"
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
              </>
            )}

            {/* HTML Widget */}
            {widget.type === 'html' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title (Optional)</label>
                  <input
                    type="text"
                    value={widget.title || ''}
                    onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom HTML</label>
                  <textarea
                    value={widget.content}
                    onChange={(e) => updateWidget(widget.id, { content: e.target.value })}
                    rows={5}
                    className="text-xs w-full px-2 py-1 border rounded font-mono text-gray-900"
                    placeholder="<div>Your HTML here</div>"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom CSS Class</label>
                  <input
                    type="text"
                    value={widget.customClass || ''}
                    onChange={(e) => updateWidget(widget.id, { customClass: e.target.value })}
                    placeholder="custom-html-widget"
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
              </>
            )}

            {/* Social Widget */}
            {widget.type === 'social' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={widget.title || ''}
                    onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                    placeholder="Follow Us"
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom CSS Class</label>
                  <input
                    type="text"
                    value={widget.customClass || ''}
                    onChange={(e) => updateWidget(widget.id, { customClass: e.target.value })}
                    placeholder="custom-social-widget"
                    className="text-xs w-full px-2 py-1 border rounded text-gray-900"
                  />
                </div>
                <p className="text-xs text-gray-500">Social links will be automatically pulled from your social links settings.</p>
              </>
            )}
          </div>
        ) : (
          /* Preview */
          <div className="text-xs text-gray-600">
            {widget.type === 'logo' && (
              <div>
                {widget.logoImage ? (
                  <img src={widget.logoImage} alt="Logo" className="max-h-12" />
                ) : (
                  <p className="text-gray-400">No logo uploaded</p>
                )}
              </div>
            )}
            {widget.type === 'text' && (
              <div>
                <p className="font-semibold">{widget.title}</p>
                <p className="mt-1 text-gray-500 line-clamp-2">{widget.content}</p>
              </div>
            )}
            {widget.type === 'menu' && (
              <div>
                <p className="font-semibold">{widget.title}</p>
                <ul className="mt-1 text-gray-500">
                  {(widget.menuItems || []).slice(0, 3).map((item, i) => (
                    <li key={i}>• {item.label}</li>
                  ))}
                  {(widget.menuItems || []).length > 3 && <li>...</li>}
                </ul>
                {widget.twoColumns && <p className="text-xs text-indigo-600 mt-1">✓ Two columns</p>}
              </div>
            )}
            {widget.type === 'html' && (
              <div>
                {widget.title && <p className="font-semibold">{widget.title}</p>}
                <p className="text-gray-400 font-mono">Custom HTML</p>
              </div>
            )}
            {widget.type === 'social' && (
              <div>
                <p className="font-semibold">{widget.title || 'Social Links'}</p>
                <p className="text-gray-400">Social icons</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Widget Type Buttons */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-3">Add Widget:</p>
        <div className="flex flex-wrap gap-2">
          {(['logo', 'text', 'menu', 'html', 'social'] as const).map(type => (
            <button
              key={type}
              onClick={() => addWidget(0, type)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              {type === 'logo' && <ImageIcon className="h-3 w-3" />}
              {type === 'text' && <Type className="h-3 w-3" />}
              {type === 'menu' && <MenuIcon className="h-3 w-3" />}
              {type === 'html' && <Code className="h-3 w-3" />}
              {type === 'social' && <Share2 className="h-3 w-3" />}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Columns Grid */}
      <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, columnIndex) => (
          <div
            key={columnIndex}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(columnIndex)}
            className="bg-gray-50 rounded-lg p-4 min-h-[200px] border-2 border-dashed border-gray-300"
          >
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Column {columnIndex + 1}</h4>
            {getColumnWidgets(columnIndex).length === 0 ? (
              <div className="text-center text-gray-400 text-xs py-8">
                <p>Drag widgets here</p>
                <p className="mt-1">or</p>
                <div className="mt-2 space-y-1">
                  {(['logo', 'text', 'menu', 'html', 'social'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => addWidget(columnIndex, type)}
                      className="block w-full px-2 py-1 text-xs bg-white border rounded hover:border-indigo-500 hover:text-indigo-600"
                    >
                      + {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              getColumnWidgets(columnIndex).map(renderWidget)
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
