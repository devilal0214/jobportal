import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/jobs',
    '/jobs/',
    '/apply/',
    '/login',
    '/register',
    '/embed/',
    '/api/jobs/public',
    '/api/applications/submit'
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route.endsWith('/')) {
      return pathname.startsWith(route)
    }
    return pathname === route
  })

  // Allow public routes and API routes that handle their own auth
  if (isPublicRoute || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Check for authentication token
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token
  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId)
  requestHeaders.set('x-user-email', payload.email)
  requestHeaders.set('x-user-role', payload.role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
