import { NextResponse } from 'next/server'
import { checkEnvironment } from '@/lib/env-check'

export async function GET() {
  try {
    // Check environment configuration
    const envCheck = checkEnvironment()
    
    // Don't expose sensitive data, only diagnostic info
    const diagnostics = {
      nodeEnv: envCheck.NODE_ENV,
      jwtSecretExists: envCheck.JWT_SECRET_EXISTS,
      jwtSecretLength: envCheck.JWT_SECRET_LENGTH,
      siteUrl: envCheck.NEXT_PUBLIC_SITE_URL,
      isUsingFallback: envCheck.IS_USING_FALLBACK,
      serverTime: new Date().toISOString(),
      timestamp: Date.now()
    }
    
    return NextResponse.json({
      success: true,
      diagnostics,
      message: envCheck.IS_USING_FALLBACK 
        ? 'WARNING: Using fallback JWT_SECRET. This may cause production issues.'
        : 'JWT_SECRET is properly configured.'
    })
  } catch (error) {
    console.error('Environment check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check environment',
        message: 'Server configuration error'
      },
      { status: 500 }
    )
  }
}
