// Test script to check application form submission feedback
const testApplicationSubmission = async () => {
  console.log('Testing application form submission...')
  
  // Get a job to apply to
  const jobsResponse = await fetch('http://localhost:3000/api/jobs')
  const jobsData = await jobsResponse.json()
  const firstJob = jobsData.jobs[0]
  
  if (!firstJob) {
    console.log('❌ No jobs found')
    return
  }
  
  console.log(`📋 Testing application for: ${firstJob.title}`)
  
  const testApplication = {
    jobId: firstJob.id,
    formData: {
      "Full Name": "Test Feedback User",
      "Email Address": "testfeedback@example.com", 
      "Phone Number": "+1234567890",
      "Years of Experience": "2 years"
    },
    fieldLabels: {
      "Full Name": "Full Name",
      "Email Address": "Email Address",
      "Phone Number": "Phone Number", 
      "Years of Experience": "Years of Experience"
    }
  }

  try {
    console.log('⏳ Submitting application...')
    const start = Date.now()
    
    const response = await fetch('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testApplication)
    })

    const duration = Date.now() - start
    const result = await response.json()
    
    if (response.ok) {
      console.log(`✅ Application submitted successfully in ${duration}ms`)
      console.log(`📝 Application ID: ${result.applicationId}`)
      console.log('✅ Success message should appear in green')
      console.log('✅ Submit button should be disabled')
    } else {
      console.log(`❌ Application failed: ${result.error}`)
      console.log('❌ Error message should appear in red')
    }
  } catch (error) {
    console.error('❌ Network error:', error)
    console.log('❌ Network error message should appear in red')
  }
}

testApplicationSubmission()
