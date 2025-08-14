// Test job creation API
async function testJobCreation() {
  console.log('🧪 TESTING JOB CREATION API\n')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in...')
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@jobportal.com',
        password: 'admin123'
      })
    })
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`)
    }
    
    const loginData = await loginResponse.json()
    const token = loginData.token
    console.log('✅ Login successful')
    
    // Step 2: Get available forms
    console.log('\n2️⃣ Fetching forms...')
    const formsResponse = await fetch(`${baseUrl}/api/admin/forms`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!formsResponse.ok) {
      throw new Error(`Forms fetch failed: ${formsResponse.status}`)
    }
    
    const forms = await formsResponse.json()
    console.log(`✅ Found ${forms.length} forms`)
    
    if (forms.length === 0) {
      console.log('❌ No forms available for job creation')
      return
    }
    
    // Step 3: Test job creation
    console.log('\n3️⃣ Creating test job...')
    const testJob = {
      title: 'Test Developer Position',
      position: 'Software Engineer',
      description: 'This is a test job creation',
      status: 'DRAFT',
      formId: forms[0].id
    }
    
    const jobResponse = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testJob)
    })
    
    console.log(`📡 Job creation response: ${jobResponse.status}`)
    
    if (jobResponse.ok) {
      const createdJob = await jobResponse.json()
      console.log('✅ Job created successfully!')
      console.log(`   📋 Job ID: ${createdJob.id}`)
      console.log(`   📝 Title: ${createdJob.title}`)
      console.log(`   📊 Status: ${createdJob.status}`)
    } else {
      const errorData = await jobResponse.json()
      console.log('❌ Job creation failed!')
      console.log(`   Error: ${errorData.error}`)
      console.log(`   Status: ${jobResponse.status}`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testJobCreation()
