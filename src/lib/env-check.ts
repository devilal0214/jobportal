import jwt from 'jsonwebtoken'

// Environment check utility for debugging JWT issues
export function checkEnvironment() {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
    JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    IS_USING_FALLBACK: !process.env.JWT_SECRET
  }
  
  console.log('Environment Check:', env)
  return env
}

export function createTestToken(payload: Record<string, unknown>) {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
  
  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
    console.log('Test token created successfully')
    return token
  } catch (error) {
    console.error('Failed to create test token:', error)
    return null
  }
}

export function verifyTestToken(token: string) {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('Token verified successfully:', decoded)
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}
