'use client'

import { useRef, useState, useEffect } from 'react'

interface HTMLEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

const HTMLEditor = ({ value, onChange, placeholder, height = 200 }: HTMLEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editableRef = useRef<HTMLDivElement>(null)
  const [isPreview, setIsPreview] = useState(true) // Default to Preview mode

  // Function to set cursor at the end of content
  const setCursorAtEnd = () => {
    if (editableRef.current) {
      try {
        const range = document.createRange()
        const selection = window.getSelection()
        
        // Get the last text node or the element itself
        const lastChild = editableRef.current.lastChild
        if (lastChild) {
          if (lastChild.nodeType === Node.TEXT_NODE) {
            range.setStart(lastChild, lastChild.textContent?.length || 0)
          } else {
            range.setStartAfter(lastChild)
          }
        } else {
          range.setStart(editableRef.current, 0)
        }
        
        range.collapse(true)
        selection?.removeAllRanges()
        selection?.addRange(range)
      } catch (error) {
        console.warn('Error setting cursor position:', error)
        // Fallback: focus the element
        editableRef.current.focus()
      }
    }
  }

  // Handle focus to set cursor at end
  const handleEditableFocus = () => {
    if (editableRef.current) {
      // If the div is empty or has placeholder, set up for typing
      if (!value || value.trim() === '') {
        editableRef.current.innerHTML = ''
      }
      // Set cursor at end after a small delay
      setTimeout(() => {
        setCursorAtEnd()
      }, 10)
    }
  }

  // Handle key events to ensure cursor stays at appropriate position
  const handleEditableKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // If the div is empty and user starts typing, clear any placeholder
    if (editableRef.current && (!value || value.trim() === '')) {
      if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') {
        editableRef.current.innerHTML = ''
      }
    }
    
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          insertTag('<strong>', '</strong>')
          break
        case 'i':
          e.preventDefault()
          insertTag('<em>', '</em>')
          break
        case '1':
          if (e.altKey) {
            e.preventDefault()
            insertTag('<h1>', '</h1>')
          }
          break
        case '2':
          if (e.altKey) {
            e.preventDefault()
            insertTag('<h2>', '</h2>')
          }
          break
        case '3':
          if (e.altKey) {
            e.preventDefault()
            insertTag('<h3>', '</h3>')
          }
          break
      }
    }
  }

  // Set cursor at end when switching to preview mode or when content changes
  useEffect(() => {
    if (isPreview && editableRef.current && value) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        setCursorAtEnd()
      }, 0)
    }
  }, [isPreview, value])

  const handleEditableChange = () => {
    if (editableRef.current) {
      const content = editableRef.current.innerHTML
      onChange(content)
    }
  }

  const handleEditableInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML
    onChange(content)
  }

  const handleEditablePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text/plain')
    
    // Insert as plain text, browser will handle basic formatting
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      
      // Convert line breaks to <br> tags for better formatting
      const formattedText = paste.replace(/\n/g, '<br>')
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = formattedText
      
      const fragment = document.createDocumentFragment()
      let lastInsertedNode: Node | null = null
      
      while (tempDiv.firstChild) {
        lastInsertedNode = tempDiv.firstChild
        fragment.appendChild(lastInsertedNode)
      }
      
      range.insertNode(fragment)
      
      // Move cursor to end of inserted content
      if (lastInsertedNode && lastInsertedNode.parentNode) {
        range.setStartAfter(lastInsertedNode)
        range.collapse(true)
      } else {
        // Fallback: set cursor at end of contentEditable
        setCursorAtEnd()
      }
      
      selection.removeAllRanges()
      selection.addRange(range)
      
      handleEditableChange()
    }
  }

  const insertTag = (startTag: string, endTag: string = '') => {
    if (isPreview && editableRef.current) {
      // For contentEditable mode
      editableRef.current.focus()
      
      let selection = window.getSelection()
      let range: Range
      
      // If no selection exists, create one at the end
      if (!selection || selection.rangeCount === 0) {
        range = document.createRange()
        range.selectNodeContents(editableRef.current)
        range.collapse(false) // Collapse to end
        selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      } else {
        range = selection.getRangeAt(0)
      }
      
      try {
        const selectedText = range.toString()
        
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = startTag + selectedText + endTag
        
        const fragment = document.createDocumentFragment()
        let lastInsertedNode: Node | null = null
        
        while (tempDiv.firstChild) {
          lastInsertedNode = tempDiv.firstChild
          fragment.appendChild(lastInsertedNode)
        }
        
        range.deleteContents()
        range.insertNode(fragment)
        
        // Move cursor to end of inserted content
        if (lastInsertedNode && lastInsertedNode.parentNode) {
          try {
            range.setStartAfter(lastInsertedNode)
            range.collapse(true)
          } catch (error) {
            console.warn('Error positioning cursor after insert:', error)
            setCursorAtEnd()
          }
        } else {
          setCursorAtEnd()
        }
        
        selection?.removeAllRanges()
        selection?.addRange(range)
        
        handleEditableChange()
      } catch (error) {
        console.warn('Error inserting tag:', error)
        // Fallback: insert at current cursor position or end
        setCursorAtEnd()
      }
    } else {
      // For textarea mode
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
              onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
              onClick={(e) => {
                e.preventDefault()
                button.action()
              }}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-400 rounded hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              title={button.label}
            >
              {button.icon}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault()
                setIsPreview(true)
              }}
              className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                isPreview ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault()
                setIsPreview(false)
              }}
              className={`px-3 py-2 text-xs font-medium border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                !isPreview ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              HTML
            </button>
          </div>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {isPreview ? (
          <div 
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleEditableInput}
            onPaste={handleEditablePaste}
            onBlur={handleEditableChange}
            onFocus={handleEditableFocus}
            onKeyDown={handleEditableKeyDown}
            className="p-4 min-h-[200px] prose prose-sm max-w-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-2 border-transparent"
            style={{ minHeight: `${height}px` }}
            dangerouslySetInnerHTML={{ 
              __html: value || `<p style="color: #9CA3AF;">${placeholder || 'Start typing here... You can paste text, use formatting buttons, or switch to HTML mode for advanced editing.'}</p>` 
            }}
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
