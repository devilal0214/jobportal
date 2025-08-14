import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: Date
  icon: string
  color: string
}

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

    if (!user || !['ADMIN', 'HR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch recent activities from various sources
    const activities: Activity[] = []

    // Recent applications (last 10)
    const recentApplications = await prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { title: true } }
      }
    })

    recentApplications.forEach(app => {
      // Parse candidate name from formData
      let candidateName = 'Unknown'
      try {
        const formData = JSON.parse(app.formData)
        // Look for name in various possible field names
        candidateName = formData['Full Name'] || formData['Name'] || formData['name'] || formData['candidateName'] || 'Unknown'
      } catch (error) {
        console.error('Error parsing form data for candidate name:', error)
      }

      activities.push({
        id: `app-${app.id}`,
        type: 'application',
        title: 'New Application Received',
        description: `${candidateName} applied for ${app.job.title}`,
        timestamp: app.createdAt,
        icon: 'FileText',
        color: 'blue'
      })
    })

    // Recent jobs (last 5)
    const recentJobs = await prisma.job.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true } }
      }
    })

    recentJobs.forEach(job => {
      activities.push({
        id: `job-${job.id}`,
        type: 'job',
        title: 'New Job Posted',
        description: `${job.creator.name || 'Unknown'} posted "${job.title}"`,
        timestamp: job.createdAt,
        icon: 'Briefcase',
        color: 'green'
      })
    })

    // Recent users (last 3)
    const recentUsers = await prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })

    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        title: 'New User Registered',
        description: `${user.name} joined as ${user.role}`,
        timestamp: user.createdAt,
        icon: 'UserPlus',
        color: 'purple'
      })
    })

    // Recent emails (last 3)
    const recentEmails = await prisma.emailLog.findMany({
      take: 3,
      orderBy: { sentAt: 'desc' },
      include: {
        template: { select: { name: true } }
      }
    })

    recentEmails.forEach(email => {
      activities.push({
        id: `email-${email.id}`,
        type: 'email',
        title: 'Email Sent',
        description: `${email.template?.name || 'Notification'} sent to ${email.to}`,
        timestamp: email.sentAt,
        icon: 'Mail',
        color: 'orange'
      })
    })

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Return top 10 activities
    return NextResponse.json({
      activities: activities.slice(0, 10)
    })

  } catch (error) {
    console.error('Activity API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
