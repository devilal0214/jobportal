import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching users...')
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    console.log('Query params:', { limit, page, skip })

    // Use raw SQL to avoid TypeScript issues
    const users = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.isActive, 
        u.createdAt,
        r.id as roleId,
        r.name as roleName,
        r.description as roleDescription
      FROM users u
      LEFT JOIN roles r ON u.roleId = r.id
      ORDER BY u.createdAt DESC
      LIMIT ${limit} OFFSET ${skip}
    `

    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users
    `

    const total = Number((totalResult as { count: bigint }[])[0]?.count || 0)
    
    // Format the users data to match expected interface
    const formattedUsers = (users as Array<{
      id: string
      name: string
      email: string
      isActive: number
      createdAt: string
      roleId?: string
      roleName?: string
      roleDescription?: string
    }>).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: Boolean(user.isActive),
      createdAt: user.createdAt,
      role: user.roleId ? {
        id: user.roleId,
        name: user.roleName,
        description: user.roleDescription
      } : null
    }))

    console.log('Users fetched successfully:', formattedUsers.length)

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user using raw SQL to avoid TypeScript issues
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    await prisma.$executeRaw`
      INSERT INTO users (id, name, email, password, roleId, isActive, createdAt, updatedAt)
      VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, ${role}, 1, datetime('now'), datetime('now'))
    `

    // Fetch the created user with role information
    const users = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.isActive, 
        u.createdAt,
        r.id as roleId,
        r.name as roleName,
        r.description as roleDescription
      FROM users u
      LEFT JOIN roles r ON u.roleId = r.id
      WHERE u.id = ${userId}
    ` as Array<{
      id: string
      name: string
      email: string
      isActive: number
      createdAt: string
      roleId?: string
      roleName?: string
      roleDescription?: string
    }>

    const createdUser = users[0]
    const formattedUser = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      isActive: Boolean(createdUser.isActive),
      createdAt: createdUser.createdAt,
      role: createdUser.roleId ? {
        id: createdUser.roleId,
        name: createdUser.roleName,
        description: createdUser.roleDescription
      } : null
    }

    return NextResponse.json(formattedUser, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
