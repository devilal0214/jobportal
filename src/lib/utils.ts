import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getStatusColor(status: string): string {
  const statusColors = {
    // Job statuses
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-red-100 text-red-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    
    // Application statuses
    PENDING: 'bg-yellow-100 text-yellow-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    INTERVIEW: 'bg-purple-100 text-purple-800',
    SELECTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    ON_HOLD: 'bg-gray-100 text-gray-800',
  }
  
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
}

export function getStatusText(status: string): string {
  const statusTexts = {
    UNDER_REVIEW: 'Under Review',
    ON_HOLD: 'On Hold',
  }
  
  return statusTexts[status as keyof typeof statusTexts] || status.charAt(0) + status.slice(1).toLowerCase()
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncateText(text: string, length: number = 100): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getRolePermissions(role: string) {
  const permissions = {
    ADMIN: {
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: true,
      canAssignJobs: true,
      canViewAllApplications: true,
      canManageUsers: true,
      canManageSettings: true,
      canManageTemplates: true,
      canCreateFormFields: true,
    },
    HR: {
      canCreateJobs: true,
      canEditJobs: true,
      canDeleteJobs: false,
      canAssignJobs: false,
      canViewAllApplications: true,
      canManageUsers: false,
      canManageSettings: false,
      canManageTemplates: false,
      canCreateFormFields: true,
    },
    MANAGER: {
      canCreateJobs: true,
      canEditJobs: false,
      canDeleteJobs: false,
      canAssignJobs: false,
      canViewAllApplications: false,
      canManageUsers: false,
      canManageSettings: false,
      canManageTemplates: false,
      canCreateFormFields: true,
    },
  }
  
  return permissions[role as keyof typeof permissions] || permissions.MANAGER
}

export function parseFormData(formData: string): Record<string, unknown> {
  try {
    return JSON.parse(formData)
  } catch {
    return {}
  }
}

export function stringifyFormData(data: Record<string, unknown>): string {
  return JSON.stringify(data)
}

export function calculateDaysAgo(date: Date | string): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 30) return `${diffInDays} days ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}
