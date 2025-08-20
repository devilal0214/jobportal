// Token debugging utility for production issues

export const debugToken = () => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    console.log('❌ No token found in localStorage')
    return null
  }
  
  try {
    // Decode JWT payload (without verification - just for debugging)
    const payload = JSON.parse(atob(token.split('.')[1]))
    
    console.log('🔍 Token Debug Info:')
    console.log('- Token present:', '✅')
    console.log('- Token length:', token.length)
    console.log('- Token starts with:', token.substring(0, 20) + '...')
    console.log('- Decoded payload:', payload)
    console.log('- Expires at:', new Date(payload.exp * 1000).toLocaleString())
    console.log('- Is expired:', Date.now() > payload.exp * 1000)
    console.log('- User ID:', payload.userId)
    console.log('- Role:', payload.role)
    
    return payload
  } catch (error) {
    console.error('❌ Error decoding token:', error)
    console.log('Token content:', token)
    return null
  }
}

export const validateTokenForAPI = async () => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    console.log('❌ No token available for API call')
    return false
  }
  
  try {
    // Test token with a simple API call
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('🔍 Token validation result:')
    console.log('- Status:', response.status)
    console.log('- OK:', response.ok)
    
    if (response.ok) {
      const user = await response.json()
      console.log('- User data:', user)
      return true
    } else {
      console.log('- Error response:', await response.text())
      return false
    }
  } catch (error) {
    console.error('❌ Token validation error:', error)
    return false
  }
}
