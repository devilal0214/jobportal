import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const statusParam = searchParams.get('status') // Add status filter
    const skip = (page - 1) * limit

    // Build the where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      isArchived: false // Exclude archived applications by default
    }
    if (statusParam) {
      // Validate status against enum values
      const validStatuses = ['PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED']
      if (validStatuses.includes(statusParam)) {
        whereClause.status = statusParam
      }
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: whereClause, // Apply status filter in the database query
        skip,
        take: limit,
        include: {
          job: {
            select: {
              title: true,
              position: true
            }
          },
          applicant: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.application.count({
        where: whereClause // Count only filtered applications
      })
    ])

    const formattedApplications = applications.map(app => {
      // Use type assertion to access fields we know exist in the database
      const appWithCandidateData = app as typeof app & {
        candidateName?: string
        candidateEmail?: string
      }
      
      // Use stored candidate data first, then fallback to formData parsing
      let candidateName = appWithCandidateData.candidateName || 'Unknown'
      let email = appWithCandidateData.candidateEmail || 'unknown@email.com'
      
      // If no candidate data in the application fields, try formData
      if (!candidateName || candidateName === 'Unknown' || !email || email === 'unknown@email.com') {
        try {
          const formData = JSON.parse(app.formData)
          
          // Try to find name and email from form data
          for (const [, value] of Object.entries(formData)) {
            if (typeof value === 'string') {
              // Detect email by @ symbol
              if (value.includes('@') && (!email || email === 'unknown@email.com')) {
                email = value
              } 
              // If it's not email and we don't have a name yet, assume it's name
              else if ((!candidateName || candidateName === 'Unknown') && !value.includes('@') && !/^\d+$/.test(value) && value.length > 1) {
                candidateName = value
              }
            }
          }
          
          // Fallback to traditional field names
          if (!candidateName || candidateName === 'Unknown') {
            candidateName = formData.name || formData.fullName || formData.candidateName || 'Unknown'
          }
          if (!email || email === 'unknown@email.com') {
            email = formData.email || 'unknown@email.com'
          }
        } catch (error) {
          console.error('Error parsing form data:', error)
        }
      }

      return {
        id: app.id,
        candidateName,
        position: app.job.title,
        status: app.status, // Keep original status for color mapping
        appliedAt: app.createdAt.toISOString(),
        email,
        isArchived: app.isArchived
      }
    })

    return NextResponse.json({
      applications: formattedApplications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Applications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, formData, fieldLabels } = await request.json()

    if (!jobId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get job details with form fields
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        form: {
          include: {
            fields: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      )
    }

    // Create a mapping of field IDs to labels for transformation
    const fieldIdToLabel: Record<string, string> = {}
    if (job.form?.fields) {
      job.form.fields.forEach((field: { id: string; label: string }) => {
        fieldIdToLabel[field.id] = field.label
      })
    }

    // Transform formData from field IDs to labels
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labeledFormData: Record<string, any> = {}
    
    for (const [fieldId, value] of Object.entries(formData)) {
      if (fieldId === 'portfolioLinks') {
        labeledFormData['Portfolio Links'] = value
        continue
      }
      
      const label = fieldIdToLabel[fieldId] || fieldLabels?.[fieldId] || fieldId
      labeledFormData[label] = value
    }

    // Extract candidate info from labeled form data
    let candidateName = 'Anonymous'
    let candidateEmail = ''
    let candidatePhone = ''
    let resumeFileName = ''
    let resumePath = ''

    // Look for common field labels and extract candidate info
    for (const [label, value] of Object.entries(labeledFormData)) {
      if (typeof value === 'string') {
        const lowerLabel = label.toLowerCase()
        
        // Match name fields
        if ((lowerLabel.includes('name') || lowerLabel.includes('full name')) && candidateName === 'Anonymous') {
          candidateName = value
        }
        // Match email fields
        else if ((lowerLabel.includes('email') || value.includes('@')) && candidateEmail === '') {
          candidateEmail = value
        }
        // Match phone fields
        else if ((lowerLabel.includes('phone') || lowerLabel.includes('mobile') || lowerLabel.includes('contact')) && /^\+?[\d\s\-\(\)]{10,}$/.test(value) && candidatePhone === '') {
          candidatePhone = value
        }
        // Check if it's a file upload (JSON format)
        else if ((lowerLabel.includes('resume') || lowerLabel.includes('cv') || lowerLabel.includes('upload')) && value.startsWith('{') && value.includes('fileName')) {
          try {
            const fileData = JSON.parse(value)
            if (fileData.fileName && fileData.path) {
              resumeFileName = fileData.fileName
              resumePath = fileData.path
            }
          } catch {
            // Not a valid file JSON, continue
          }
        }
      }
    }

    // Extract source information from request headers
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const origin = request.headers.get('origin') || ''
    
    // Get client IP address for geolocation
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown'
    
    // Get geolocation data from IP
    let locationData = {
      city: '',
      state: '',
      country: '',
      latitude: null as number | null,
      longitude: null as number | null
    }
    
    // Only attempt geolocation for real IPs (not localhost/development)
    if (clientIp !== 'unknown' && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1') && !clientIp.includes('localhost')) {
      try {
        // Using ip-api.com (free, no API key required)
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,regionName,city,lat,lon`, {
          method: 'GET',
          headers: {
            'User-Agent': 'JobPortal/1.0'
          }
        })
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          if (geoData.status === 'success') {
            locationData = {
              city: geoData.city || '',
              state: geoData.regionName || '',
              country: geoData.country || '',
              latitude: geoData.lat || null,
              longitude: geoData.lon || null
            }
          }
        }
      } catch (error) {
        console.warn('Geolocation failed:', error)
        // Continue without location data
      }
    }
    
    // For development/localhost, set a default location
    if (clientIp.includes('127.0.0.1') || clientIp.includes('::1') || clientIp.includes('localhost') || clientIp === 'unknown') {
      locationData = {
        city: 'Development Environment',
        state: 'Local',
        country: 'Localhost',
        latitude: null,
        longitude: null
      }
    }
    
    // Determine source domain
    let sourceDomain = ''
    let sourceUrl = ''
    
    if (referer) {
      try {
        const url = new URL(referer)
        sourceDomain = url.hostname
        sourceUrl = referer
      } catch {
        // Invalid URL, fallback to origin
        if (origin) {
          try {
            const url = new URL(origin)
            sourceDomain = url.hostname
            sourceUrl = origin
          } catch {
            // Keep empty if both fail
          }
        }
      }
    } else if (origin) {
      try {
        const url = new URL(origin)
        sourceDomain = url.hostname
        sourceUrl = origin
      } catch {
        // Keep empty if parsing fails
      }
    }

    // Create application with labeled data and location
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const application = await (prisma.application as any).create({
      data: {
        jobId,
        candidateName,
        candidateEmail,
        candidatePhone,
        resume: resumeFileName,
        resumePath: resumePath,
        coverLetter: labeledFormData['Cover Letter'] || '',
        status: 'PENDING',
        formData: JSON.stringify(labeledFormData),
        sourceDomain,
        sourceUrl,
        userAgent,
        // Add location data
        candidateCity: locationData.city,
        candidateState: locationData.state,
        candidateCountry: locationData.country,
        candidateLatitude: locationData.latitude,
        candidateLongitude: locationData.longitude,
        candidateIP: clientIp
      }
    })

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: 'Application submitted successfully'
    })

  } catch (error) {
    console.error('Application submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
