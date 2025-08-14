'use client'

import { useRef, useState } from 'react'

interface HTMLEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

const HTMLEditor = ({ value, onChange, placeholder, height = 200 }: HTMLEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isPreview, setIsPreview] = useState(false)

  const insertTag = (startTag: string, endTag: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)
    
    const newText = beforeText + startTag + selectedText + endTag + afterText
    onChange(newText)
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + startTag.length, start + startTag.length + selectedText.length)
      } else {
        textarea.setSelectionRange(start + startTag.length, start + startTag.length)
      }
    }, 0)
  }

  const formatButtons = [
    { label: 'Bold', action: () => insertTag('<strong>', '</strong>'), icon: 'B' },
    { label: 'Italic', action: () => insertTag('<em>', '</em>'), icon: 'I' },
    { label: 'H1', action: () => insertTag('<h1>', '</h1>'), icon: 'H1' },
    { label: 'H2', action: () => insertTag('<h2>', '</h2>'), icon: 'H2' },
    { label: 'H3', action: () => insertTag('<h3>', '</h3>'), icon: 'H3' },
    { label: 'Paragraph', action: () => insertTag('<p>', '</p>'), icon: 'P' },
    { label: 'Line Break', action: () => insertTag('<br>'), icon: 'BR' },
    { label: 'Link', action: () => insertTag('<a href="">', '</a>'), icon: 'Link' },
    { label: 'List Item', action: () => insertTag('<li>', '</li>'), icon: 'Li' },
    { label: 'Unordered List', action: () => insertTag('<ul>\n', '\n</ul>'), icon: 'UL' },
    { label: 'Ordered List', action: () => insertTag('<ol>\n', '\n</ol>'), icon: 'OL' },
  ]

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-3 bg-gray-100">
        <div className="flex flex-wrap gap-2">
          {formatButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-400 rounded hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              title={button.label}
            >
              {button.icon}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                !isPreview ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                isPreview ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {isPreview ? (
          <div 
            className="p-4 min-h-[200px] prose prose-sm max-w-none text-gray-900"
            style={{ minHeight: `${height}px` }}
            dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-400">Nothing to preview</p>' }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 border-0 resize-none focus:outline-none focus:ring-0 font-mono text-sm text-gray-900 placeholder-gray-400"
            style={{ height: `${height}px` }}
          />
        )}
      </div>
    </div>
  )
}

export default HTMLEditor
