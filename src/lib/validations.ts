import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'HR', 'MANAGER']).optional(),
})

// Job schemas
export const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  position: z.string().min(2, 'Entry level is required'),
  location: z.string().min(2, 'Location is required').optional(),
  experience: z.string().min(1, 'Experience level is required').optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED', 'DRAFT']).optional(),
  assigneeId: z.string().optional(),
  formId: z.string().optional(),
  salary: z.string().optional(),
  imageUrl: z.string().optional(),
  bannerImageUrl: z.string().optional(),
})

// Application schemas
export const applicationSchema = z.object({
  jobId: z.string().cuid(),
  formData: z.record(z.string(), z.any()),
})

export const applicationStatusSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'INTERVIEW', 'SELECTED', 'REJECTED', 'ON_HOLD']),
  remarks: z.string().optional(),
})

// Form field schemas
export const formFieldSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required'),
  fieldType: z.enum(['TEXT', 'EMAIL', 'PHONE', 'TEXTAREA', 'SELECT', 'RADIO', 'CHECKBOX', 'FILE', 'DATE', 'NUMBER']),
  label: z.string().min(1, 'Label is required'),
  placeholder: z.string().optional(),
  options: z.string().optional(), // JSON string
  isRequired: z.boolean().optional(),
  order: z.number().optional(),
})

// Email template schemas
export const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  type: z.enum(['APPLICATION_STATUS', 'APPLICATION_RECEIVED', 'ADMIN_NOTIFICATION', 'INTERVIEW_SCHEDULED', 'WELCOME']),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  variables: z.string().optional(), // JSON string
  isActive: z.boolean().optional(),
})

// Settings schemas
export const settingsSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string(),
  type: z.enum(['text', 'number', 'boolean', 'json']).optional(),
})

// File upload schema
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => file instanceof File, 'Please select a file'),
})

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type JobInput = z.infer<typeof jobSchema>
export type ApplicationInput = z.infer<typeof applicationSchema>
export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>
export type FormFieldInput = z.infer<typeof formFieldSchema>
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
export type SearchInput = z.infer<typeof searchSchema>
