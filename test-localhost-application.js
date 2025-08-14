// Test script to submit an application from localhost to verify filtering
const submitLocalhostApplication = async () => {
  const testApplication = {
    jobId: "cmdx9fikw00085jgkb3f8pv6t", // WordPress Developer job
    formData: {
      "Full Name": "Localhost Test User",
      "Email Address": "localhost@example.com", 
      "Phone Number": "+9876543210",
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
    console.log('Submitting localhost application...')
    const response = await fetch('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Localhost-Bot/1.0'
      },
      body: JSON.stringify(testApplication)
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Application submitted successfully!')
      console.log('Application ID:', result.applicationId)
      
      // Now fetch the application to check if localhost location was handled correctly
      console.log('\nFetching application details...')
      const appResponse = await fetch(`http://localhost:3000/api/applications/${result.applicationId}`)
      const appData = await appResponse.json()
      
      console.log('\n📍 Localhost Location Data Check:')
      console.log('City:', appData.candidateCity)
      console.log('State:', appData.candidateState) 
      console.log('Country:', appData.candidateCountry)
      console.log('IP:', appData.candidateIP)
      
      if (appData.candidateCity === 'Development Environment' && 
          appData.candidateState === 'Local' && 
          appData.candidateCountry === 'Localhost') {
        console.log('✅ Localhost location data saved correctly!')
        console.log('✅ This should be filtered out in the UI display')
      } else {
        console.log('❌ Unexpected localhost location data')
      }
      
    } else {
      console.log('❌ Application submission failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

submitLocalhostApplication()
