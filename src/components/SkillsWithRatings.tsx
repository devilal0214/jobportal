'use client'

import { useState, useEffect } from 'react'
import TagsInput from './TagsInput'

interface SkillRating {
  skill: string
  rating: number
}

interface SkillsWithRatingsProps {
  value: SkillRating[]
  onChange: (skills: SkillRating[]) => void
  options?: string[]
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
  onValidationChange?: (isValid: boolean) => void
}

export default function SkillsWithRatings({
  value = [],
  onChange,
  options = [],
  placeholder = "Type to add skills...",
  className = "",
  id,
  disabled = false,
  onValidationChange
}: SkillsWithRatingsProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    value.map(s => s.skill)
  )

  // Validation effect
  useEffect(() => {
    if (onValidationChange) {
      const allSkillsRated = value.length === 0 || value.every(s => s.rating > 0)
      onValidationChange(allSkillsRated)
    }
  }, [value, onValidationChange])

  const handleSkillsChange = (skills: string[]) => {
    setSelectedSkills(skills)
    
    // Create new skill ratings array
    const newSkillRatings: SkillRating[] = skills.map(skill => {
      const existing = value.find(s => s.skill === skill)
      return existing || { skill, rating: 0 } // Default to 0 stars (unrated - requires selection)
    })
    
    onChange(newSkillRatings)
  }

  const handleRatingChange = (skill: string, rating: number) => {
    const updatedRatings = value.map(s => 
      s.skill === skill ? { ...s, rating } : s
    )
    onChange(updatedRatings)
  }

  const renderNumberInput = (skill: string, currentRating: number) => {
    const hasNoRating = currentRating === 0
    
    return (
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min="0.5"
          max="10"
          step="0.5"
          disabled={disabled}
          value={hasNoRating ? '' : currentRating}
          onChange={(e) => {
            let val = parseFloat(e.target.value)
            if (isNaN(val)) val = 0
            if (val > 10) val = 10
            if (val < 0) val = 0
            handleRatingChange(skill, val)
          }}
          className={`w-20 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            hasNoRating ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="e.g. 7.5"
        />
        <span className={`text-sm ${hasNoRating ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
          {hasNoRating ? 'Required' : '/ 10'}
        </span>
      </div>
    )
  }

  return (
    <div className={className} id={id}>
      {/* Skills Input */}
      <TagsInput
        value={selectedSkills}
        onChange={handleSkillsChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
      />
      
      {/* Skills with Ratings */}
      {value.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Rate your skills: <span className="text-red-500">*</span>
          </h4>
          {value.map((skillRating, index) => {
            const hasNoRating = skillRating.rating === 0
            return (
              <div key={index} className={`flex items-center justify-between p-3 rounded-md ${
                hasNoRating ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
              }`}>
                <span className="text-sm font-medium text-gray-900">
                  {skillRating.skill}
                </span>
                {renderNumberInput(skillRating.skill, skillRating.rating)}
              </div>
            )
          })}
          {value.some(s => s.rating === 0) && (
            <p className="text-xs text-red-600 mt-2">
              Please rate all skills out of 10 before submitting the application.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
