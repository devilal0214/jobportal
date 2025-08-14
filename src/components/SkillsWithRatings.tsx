'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
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

  const renderStarRating = (skill: string, currentRating: number) => {
    const hasNoRating = currentRating === 0
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(skill, star)}
            className="focus:outline-none"
            disabled={disabled}
          >
            <Star
              className={`h-4 w-4 ${
                star <= currentRating 
                  ? 'text-yellow-400 fill-current' 
                  : hasNoRating 
                    ? 'text-red-300 hover:text-red-400' 
                    : 'text-gray-300'
              } ${disabled ? 'opacity-50' : 'hover:text-yellow-300'}`}
            />
          </button>
        ))}
        <span className={`text-xs ml-2 ${hasNoRating ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
          {hasNoRating ? 'Required' : `${currentRating}/5`}
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
                {renderStarRating(skillRating.skill, skillRating.rating)}
              </div>
            )
          })}
          {value.some(s => s.rating === 0) && (
            <p className="text-xs text-red-600 mt-2">
              Please rate all skills before submitting the application.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
