import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint to verify API is working
export const maxDuration = 120
export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('🔔 Health check called')
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'API is responsive' 
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🔔 Test POST called')
  
  try {
    // Simulate some processing
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const elapsed = Date.now() - startTime
    console.log(`🔔 Test POST completed in ${elapsed}ms`)
    
    return NextResponse.json({ 
      status: 'ok',
      elapsed,
      message: 'POST endpoint working'
    })
  } catch (error) {
    console.error('🔔 Test POST error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
