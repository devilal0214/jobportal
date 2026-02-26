'use client'

import * as React from 'react'
import { useAlert } from '@/contexts/AlertContext'

/** Match your Prisma shape coming from /api (string enum, options as JSON string) */
export type FormFieldDB = {
  id: string
  fieldName: string
  fieldType: string // e.g. 'TEXT' | 'EMAIL' | 'PAGE_BREAK' ...
  label: string
  placeholder?: string | null
  options?: string | null  // JSON string in DB (["A","B","C"])
  cssClass?: string | null
  fieldId?: string | null
  fieldWidth?: string | null // '25%' | '33%' | '50%' | '66%' | '75%' | '100%'
  isRequired: boolean
  order: number
}

export type FormDB = {
  id: string
  name: string
  description?: string | null
  fields: FormFieldDB[]
}

export type ApplicationFormStepperProps = {
  form: FormDB
  /** Called after final validation, pass values to your submit API */
  onSubmit: (values: Record<string, any>) => Promise<void> | void
  /** Optional: track current step externally */
  onStepChange?: (stepIndex: number) => void
  /** Optional: default first step = 0 */
  initialStep?: number
}

/** Split fields into steps by PAGE_BREAK */
function groupByPageBreak(fields: FormFieldDB[]) {
  const steps: FormFieldDB[][] = []
  let buf: FormFieldDB[] = []
  for (const f of fields) {
    if (f.fieldType === 'PAGE_BREAK') {
      steps.push(buf)
      buf = []
      continue
    }
    buf.push(f)
  }
  steps.push(buf)
  // remove empty buckets at ends (in case a page starts/ends with PAGE_BREAK)
  return steps.filter(step => step.length > 0)
}

/** DB stores options as JSON string */
function parseOptions(opt?: string | null): string[] {
  if (!opt) return []
  try {
    const parsed = JSON.parse(opt)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

/** Map 25%/50% etc. to Tailwind grid columns (12-col grid) */
function widthToCols(width?: string | null) {
  switch (width) {
    case '25%': return 'col-span-3'
    case '33%': return 'col-span-4'
    case '50%': return 'col-span-6'
    case '66%': return 'col-span-8'
    case '75%': return 'col-span-9'
    default: return 'col-span-12' // '100%' or undefined
  }
}

export default function ApplicationFormStepper({
  form,
  onSubmit,
  onStepChange,
  initialStep = 0
}: ApplicationFormStepperProps) {
  const { showError } = useAlert();
  const steps = React.useMemo(
    () => groupByPageBreak((form?.fields ?? []).sort((a, b) => a.order - b.order)),
    [form?.fields]
  )

  const [step, setStep] = React.useState<number>(Math.min(initialStep, Math.max(steps.length - 1, 0)))
  const isLast = step === steps.length - 1

  // Flat key-value store (fieldName => value)
  const [values, setValues] = React.useState<Record<string, any>>({})

  const updateValue = (name: string, value: any) =>
    setValues(prev => ({ ...prev, [name]: value }))

  const validateStep = (): boolean => {
    const current = steps[step] || []
    for (const f of current) {
      if (!f.isRequired) continue
      const v = values[f.fieldName]
      if (v === undefined || v === null || String(v).trim?.() === '') {
        showError(`Please fill required field: ${f.label}`)
        return false
      }
    }
    return true
  }

  const goNext = () => {
    if (!validateStep()) return
    const next = Math.min(step + 1, steps.length - 1)
    setStep(next)
    onStepChange?.(next)
  }

  const goPrev = () => {
    const prev = Math.max(step - 1, 0)
    setStep(prev)
    onStepChange?.(prev)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return
    await onSubmit(values)
  }

  if (!form || steps.length === 0) {
    return (
      <div className="p-6 border rounded-md bg-white">
        <p className="text-gray-600">No fields configured for this form.</p>
      </div>
    )
  }

  const commonInputClass =
    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 text-gray-900 placeholder-gray-600'

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-12 gap-4">
        {(steps[step] || []).map((field) => {
          const id = field.fieldId || field.fieldName
          const gridCols = widthToCols(field.fieldWidth)
          const currentValue = values[field.fieldName] ?? ''

          const labelEl = (
            <label htmlFor={id} className="block text-sm font-medium text-gray-800">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          )

          let control: React.ReactNode = null
          switch (field.fieldType) {
            case 'TEXT':
              control = (
                <input
                  id={id}
                  name={field.fieldName}
                  type="text"
                  className={`${commonInputClass} ${field.cssClass || ''}`}
                  placeholder={field.placeholder || ''}
                  value={currentValue}
                  onChange={(e) => updateValue(field.fieldName, e.target.value)}
                />
              )
              break
            case 'EMAIL':
              control = (
                <input
                  id={id}
                  name={field.fieldName}
                  type="email"
                  className={`${commonInputClass} ${field.cssClass || ''}`}
                  placeholder={field.placeholder || ''}
                  value={currentValue}
                  onChange={(e) => updateValue(field.fieldName, e.target.value)}
                />
              )
              break
            case 'PHONE':
              control = (
                <input
                  id={id}
                  name={field.fieldName}
                  type="tel"
                  className={`${commonInputClass} ${field.cssClass || ''}`}
                  placeholder={field.placeholder || ''}
                  value={currentValue}
                  onChange={(e) => updateValue(field.fieldName, e.target.value)}
                />
              )
              break
            case 'TEXTAREA':
              control = (
                <textarea
                  id={id}
                  name={field.fieldName}
                  rows={4}
                  className={`${commonInputClass} ${field.cssClass || ''}`}
                  placeholder={field.placeholder || ''}
                  value={currentValue}
                  onChange={(e) => updateValue(field.fieldName, e.target.value)}
                />
              )
              break
            case 'NUMBER':
              control = (
                <input
                  id={id}
                  name={field.fieldName}
                  type="number"
                  className={`${commonInputClass} ${field.cssClass || ''}`}
                  placeholder={field.placeholder || ''}
                  value={currentValue}
                  onChange={(e) => updateValue(field.fieldName, e.target.value)}
                />
              )
              break
            case 'DATE':
              control = (
                <input
                  id={id}
                  name={field.fieldName}
                  type="date"
                  className={`${commonInputClass} ${field.cssClass || ''}`}
                  value={currentValue}
                  onChange={(e) => updateValue(field.fieldName, e.target.value)}
                />
              )
              break
            case 'URL':
              control = (
                <input
                  id={id}
                  name={field.fieldName}
                  type="url"
                  className={`${commonInputClass} ${field.cssClass || ''}`}
                  placeholder={field.placeholder || ''}
                  value={currentValue}
                  onChange={(e) => updateValue(field.fieldName, e.target.value)}
                />
              )
              break
            case 'SELECT': {
              const opts = parseOptions(field.options)
              control = (
                <select
                  id={id}
                  name={field.fieldName}
                  className={`${commonInputClass} ${field.cssClass || ''}`}
                  value={currentValue}
                  onChange={(e) => updateValue(field.fieldName, e.target.value)}
                >
                  <option value="">{field.placeholder || 'Select an option'}</option>
                  {opts.map((o, i) => <option key={i} value={o}>{o}</option>)}
                </select>
              )
              break
            }
            case 'RADIO': {
              const opts = parseOptions(field.options)
              control = (
                <div id={id} className={field.cssClass || ''}>
                  {opts.map((o, i) => (
                    <label key={i} className="flex items-center space-x-2 mb-2">
                      <input
                        type="radio"
                        name={field.fieldName}
                        value={o}
                        checked={values[field.fieldName] === o}
                        onChange={() => updateValue(field.fieldName, o)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-800">{o}</span>
                    </label>
                  ))}
                </div>
              )
              break
            }
            case 'CHECKBOX': {
              const opts = parseOptions(field.options)
              const current: string[] = Array.isArray(values[field.fieldName]) ? values[field.fieldName] : []
              control = (
                <div id={id} className={field.cssClass || ''}>
                  {opts.map((o, i) => {
                    const checked = current.includes(o)
                    return (
                      <label key={i} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          value={o}
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...current, o]
                              : current.filter(x => x !== o)
                            updateValue(field.fieldName, next)
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-800">{o}</span>
                      </label>
                    )
                  })}
                </div>
              )
              break
            }
            case 'FILE':
              control = (
                <div className={`border-2 border-dashed border-gray-300 rounded-md p-6 text-center ${field.cssClass || ''}`}>
                  <input
                    id={id}
                    name={field.fieldName}
                    type="file"
                    className="hidden"
                    onChange={(e) => updateValue(field.fieldName, e.target.files?.[0] || null)}
                  />
                  <label htmlFor={id} className="cursor-pointer text-sm text-gray-700">
                    Choose file…
                  </label>
                  <div className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 2MB)</div>
                  {values[field.fieldName] && (
                    <div className="text-xs mt-2 text-gray-700">
                      {(values[field.fieldName] as File).name}
                    </div>
                  )}
                </div>
              )
              break
            // PAGE_BREAK does not render here (we already split on it)
            default:
              control = (
                <input
                  id={id}
                  name={field.fieldName}
                  type="text"
                  className={`${commonInputClass} ${field.cssClass || ''}`}
                  placeholder={field.placeholder || ''}
                  value={currentValue}
                  onChange={(e) => updateValue(field.fieldName, e.target.value)}
                />
              )
          }

          return (
            <div key={field.id} className={`space-y-2 ${gridCols}`}>
              {labelEl}
              {control}
            </div>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 disabled:opacity-50"
        >
          Previous
        </button>

        {!isLast ? (
          <button
            type="button"
            onClick={goNext}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            Submit
          </button>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500 text-right">
        Step {step + 1} of {steps.length}
      </div>
    </form>
  )
}
