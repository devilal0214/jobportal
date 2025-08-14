import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Parse form data (now stored with labels as keys)
    let formData: Record<string, unknown> = {}
    try {
      formData = JSON.parse(application.formData)
    } catch (error) {
      console.error('Error parsing form data:', error)
      formData = {}
    }

    // Extract candidate info from application fields and form data
    let candidateName = 'Unknown'
    let candidateEmail = 'unknown@email.com'
    let candidatePhone = ''

    // Type assertion to access fields that we know exist in the database
    interface ExtendedApplication {
      candidateName?: string
      candidateEmail?: string
      candidatePhone?: string
      resume?: string
      resumePath?: string
      candidateCity?: string
      candidateState?: string
      candidateCountry?: string
      candidateLatitude?: number
      candidateLongitude?: number
      candidateIP?: string
    }
    
    const extendedApp = application as ExtendedApplication

    // Try to extract from stored fields first
    if (extendedApp.candidateName) candidateName = extendedApp.candidateName
    if (extendedApp.candidateEmail) candidateEmail = extendedApp.candidateEmail
    if (extendedApp.candidatePhone) candidatePhone = extendedApp.candidatePhone

    // For new labeled data format, extract from well-known labels
    if (candidateName === 'Unknown' || candidateEmail === 'unknown@email.com') {
      for (const [label, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
          const lowerLabel = label.toLowerCase()
          
          // Match name fields
          if ((lowerLabel.includes('name') || lowerLabel.includes('full name')) && candidateName === 'Unknown') {
            candidateName = value
          }
          // Match email fields
          else if ((lowerLabel.includes('email') || value.includes('@')) && candidateEmail === 'unknown@email.com') {
            candidateEmail = value
          }
          // Match phone fields
          else if ((lowerLabel.includes('phone') || lowerLabel.includes('mobile') || lowerLabel.includes('contact')) && candidatePhone === '') {
            candidatePhone = value
          }
        }
      }
    }

    // Create properly formatted form data for display
    // Since data is now stored with labels as keys, we can use them directly
    let formattedFormData: Array<{
      id: string
      label: string
      fieldType: string
      value: string | string[]
    }> = []
    
    if (Object.keys(formData).length > 0) {
      formattedFormData = Object.entries(formData)
        .filter(([key]) => !['Portfolio Links'].includes(key))
        .map(([label, value], index) => {
          let fieldType = 'TEXT'
          
          if (typeof value === 'string') {
            const lowerLabel = label.toLowerCase()
            
            if (value.includes('@')) {
              fieldType = 'EMAIL'
            } else if (/^\+?[\d\s\-\(\)]+$/.test(value) && value.length >= 10) {
              fieldType = 'TEL'
            } else if (lowerLabel.includes('skill') && value.startsWith('[')) {
              fieldType = 'SKILLS'
            } else if (value.length > 100) {
              fieldType = 'TEXTAREA'
            } else if (lowerLabel.includes('experience') || lowerLabel.includes('years')) {
              fieldType = 'SELECT'
            } else if (value.startsWith('{') && value.includes('fileName')) {
              fieldType = 'FILE'
            } else if (value.startsWith('http')) {
              fieldType = 'URL'
            }
          } else if (Array.isArray(value)) {
            fieldType = 'TAGS'
          }
          
          return {
            id: `field_${index}`,
            label,
            fieldType,
            value: value as string | string[]
          }
        })
    }

    // Extract portfolio links separately
    const portfolioLinks = formData['Portfolio Links'] && Array.isArray(formData['Portfolio Links']) 
      ? formData['Portfolio Links'].filter((link: string) => link && link.trim() !== '')
      : []

    const response = {
      id: application.id,
      candidateName,
      email: candidateEmail,
      phone: candidatePhone,
      position: application.job.position || application.job.title,
      jobTitle: application.job.title,
      company: 'Job Portal',
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      formData: formattedFormData,
      portfolioLinks,
      resumePath: extendedApp.resumePath || null,
      resume: extendedApp.resume || null,
      candidateCity: extendedApp.candidateCity || null,
      candidateState: extendedApp.candidateState || null,
      candidateCountry: extendedApp.candidateCountry || null,
      candidateLatitude: extendedApp.candidateLatitude || null,
      candidateLongitude: extendedApp.candidateLongitude || null,
      candidateIP: extendedApp.candidateIP || null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Application detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ 
      id: updatedApplication.id,
      status: updatedApplication.status,
      message: 'Status updated successfully'
    })
  } catch (error) {
    console.error('Application status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
