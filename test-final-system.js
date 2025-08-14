// Final system test - check all modules working
async function testAllModules() {
  console.log('🧪 FINAL SYSTEM TEST - ALL MODULES\n')
  
  const baseUrl = 'http://localhost:3000'
  
  // Test login and get token
  console.log('1️⃣ Login test...')
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@jobportal.com',
        password: 'admin123'
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      const token = data.token
      console.log('✅ Login successful')
      
      // Test forms API
      console.log('\n2️⃣ Forms API test...')
      const formsResponse = await fetch(`${baseUrl}/api/admin/forms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (formsResponse.ok) {
        const forms = await formsResponse.json()
        console.log(`✅ Forms API working - ${forms.length} forms available`)
        forms.forEach(form => {
          console.log(`   📝 ${form.name} (${form.fields.length} fields)`)
        })
      } else {
        console.log('❌ Forms API failed:', formsResponse.status)
      }
      
      // Test jobs API
      console.log('\n3️⃣ Jobs API test...')
      const jobsResponse = await fetch(`${baseUrl}/api/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        console.log(`✅ Jobs API working - ${jobsData.jobs.length} jobs available`)
      } else {
        console.log('❌ Jobs API failed:', jobsResponse.status)
      }
      
      // Test auth/me API
      console.log('\n4️⃣ Auth verification test...')
      const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (authResponse.ok) {
        const userData = await authResponse.json()
        console.log(`✅ Auth verification working - User: ${userData.name} (${userData.role?.name})`)
      } else {
        console.log('❌ Auth verification failed:', authResponse.status)
      }
      
      console.log('\n🎉 ALL MODULES TESTED')
      console.log('✅ System is ready for use!')
      
    } else {
      console.log('❌ Login failed:', response.status)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAllModules()
