import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Fetch the job with related data
    const job = await prisma.job.findUnique({
      where: {
        id,
        status: 'ACTIVE' // Only show active jobs publicly
      },
      include: {
        creator: {
          select: {
            name: true
          }
        },
        form: {
          select: {
            id: true,
            name: true
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

    // Transform job data for public view
    const publicJob = {
      id: job.id,
      title: job.title,
      description: job.description,
      position: job.position,
      department: job.department,
      location: job.location,
      salary: job.salary,
      experienceLevel: job.experienceLevel,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      formId: job.form?.id,
      formName: job.form?.name,
      imageUrl: (job as { imageUrl?: string }).imageUrl || getJobImageUrl(job.department, job.position),
      bannerImageUrl: (job as { bannerImageUrl?: string }).bannerImageUrl
    }

    return NextResponse.json(publicJob)
  } catch (error) {
    console.error('Public job fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

// Helper function to generate job image URLs based on category
function getJobImageUrl(department: string | null, position: string | null): string {
  const defaultImages: { [key: string]: string } = {
    'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
    'Development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    'Marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    'Sales': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop',
    'HR': 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop',
    'Finance': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop',
    'Engineering': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=400&fit=crop',
    'Video Editing': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=400&fit=crop',
    'Graphic Design': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=400&fit=crop',
    'Content Writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=400&fit=crop'
  }

  if (department && defaultImages[department]) {
    return defaultImages[department]
  }

  if (position) {
    const positionLower = position.toLowerCase()
    if (positionLower.includes('designer') || positionLower.includes('design')) {
      return defaultImages['Design']
    }
    if (positionLower.includes('developer') || positionLower.includes('engineer')) {
      return defaultImages['Development']
    }
    if (positionLower.includes('video') || positionLower.includes('editor')) {
      return defaultImages['Video Editing']
    }
    if (positionLower.includes('writer') || positionLower.includes('content')) {
      return defaultImages['Content Writing']
    }
    if (positionLower.includes('marketing')) {
      return defaultImages['Marketing']
    }
  }

  return 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop'
}
