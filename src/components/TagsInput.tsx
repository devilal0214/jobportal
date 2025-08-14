'use client'

import { useState, KeyboardEvent } from 'react'

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  options?: string[]
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

export default function TagsInput({
  value = [],
  onChange,
  options = [],
  placeholder = "Type to add tags...",
  className = "",
  id,
  disabled = false
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag])
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const filteredOptions = options.filter(option => 
    !value.includes(option) && 
    option.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className={`relative ${className}`} id={id}>
      <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-md bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {value.map((tag, index) => (
          <span 
            key={index}
            className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(e.target.value.length > 0 && options.length > 0)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length > 0 && options.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="border-none outline-none bg-transparent text-gray-900 font-medium flex-1 min-w-24"
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addTag(option)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-gray-900 font-medium"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Available tags */}
      {options.length > 0 && !disabled && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-gray-600 font-medium">Available: </span>
          {options.filter(option => !value.includes(option)).slice(0, 5).map((option, index) => (
            <button 
              key={index}
              type="button"
              onClick={() => addTag(option)}
              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:bg-gray-300 font-medium transition-colors"
            >
              + {option}
            </button>
          ))}
          {options.filter(option => !value.includes(option)).length > 5 && (
            <span className="text-xs text-gray-500">
              +{options.filter(option => !value.includes(option)).length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
