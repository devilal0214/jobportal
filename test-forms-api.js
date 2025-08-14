// Test forms API authentication and job creation flow
const fetch = require('node-fetch')

async function testFormsAPI() {
  const baseUrl = 'http://localhost:3000'
  console.log('🔍 Testing Forms API Authentication...\n')
  
  try {
    // Step 1: Test unauthenticated access to forms API
    console.log('1️⃣ Testing unauthenticated access to /api/admin/forms...')
    const unauthResponse = await fetch(`${baseUrl}/api/admin/forms`)
    console.log(`Status: ${unauthResponse.status}`)
    
    if (unauthResponse.status === 401) {
      console.log('✅ Correctly returns 401 Unauthorized for unauthenticated requests')
    } else {
      console.log('❌ Should return 401 for unauthenticated requests')
    }
    
    // Step 2: Test login to get a token
    console.log('\n2️⃣ Testing login to get authentication token...')
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@jobportal.com',
        password: 'admin123'
      })
    })
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json()
      const token = loginData.token
      console.log('✅ Login successful, token received')
      
      // Step 3: Test authenticated access to forms API
      console.log('\n3️⃣ Testing authenticated access to /api/admin/forms...')
      const authResponse = await fetch(`${baseUrl}/api/admin/forms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (authResponse.ok) {
        const forms = await authResponse.json()
        console.log(`✅ Successfully fetched ${forms.length} forms`)
        forms.forEach(form => {
          console.log(`   - ${form.name} (${form.fields.length} fields)`)
        })
      } else {
        console.log(`❌ Failed to fetch forms: ${authResponse.status}`)
        const errorText = await authResponse.text()
        console.log('Error:', errorText)
      }
      
    } else {
      console.log('❌ Login failed')
      const errorText = await loginResponse.text()
      console.log('Error:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testFormsAPI()
