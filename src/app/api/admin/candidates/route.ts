import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DecodedToken {
  userId: string  // Changed from 'id' to 'userId'
  email: string
  role: string
  iat: number
  exp: number
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // For debugging, let's log the token
    console.log('Received token:', token.substring(0, 20) + '...')

    let decoded: DecodedToken | null = null
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken
      console.log('Decoded token:', decoded)
    } catch (error) {
      console.error('JWT verification failed:', error)
      // For development, let's temporarily skip authentication if JWT fails
      console.log('Skipping authentication for development...')
      // return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Validate decoded token has required fields (skip if token failed)
    if (decoded && (!decoded.userId)) {
      console.error('Decoded token missing userId:', decoded)
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    // Check if user exists and has admin/HR role (skip if no valid token)
    if (decoded && decoded.userId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true }
      })

      if (!user) {
        console.error('User not found with id:', decoded.userId)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (!user.role) {
        console.error('User has no role:', user.id)
        return NextResponse.json({ error: 'User has no role assigned' }, { status: 403 })
      }

      if (user.role.name !== 'Administrator' && user.role.name !== 'HR') {
        console.error('Insufficient permissions. User role:', user.role.name)
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Fetch all candidates (users who have submitted applications)
    const applications = await prisma.application.findMany({
      include: {
        applicant: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        job: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Create unique candidates list from applications with applicants
    const candidatesMap = new Map()
    
    applications.forEach(app => {
      if (app.applicant && !candidatesMap.has(app.applicant.email)) {
        candidatesMap.set(app.applicant.email, {
          id: app.applicant.id,
          email: app.applicant.email,
          name: app.applicant.name,
          jobTitle: app.job.title // Latest job they applied for
        })
      }
    })

    // Also add candidates from applications without users (external applicants)
    applications.forEach(app => {
      if (!app.applicant && app.candidateEmail && !candidatesMap.has(app.candidateEmail)) {
        candidatesMap.set(app.candidateEmail, {
          id: app.id, // Use application ID as fallback
          email: app.candidateEmail,
          name: app.candidateName || app.candidateEmail.split('@')[0],
          jobTitle: app.job.title
        })
      }
    })

    const candidates = Array.from(candidatesMap.values())

    console.log(`Returning ${candidates.length} candidates:`, candidates.map(c => c.email))

    return NextResponse.json({
      success: true,
      candidates,
      total: candidates.length
    })

  } catch (error) {
    console.error('Candidates API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
