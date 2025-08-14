// Test script to submit an application and check geolocation
const submitTestApplication = async () => {
  const testApplication = {
    jobId: "cmdx9fikw00085jgkb3f8pv6t", // WordPress Developer job
    formData: {
      "Full Name": "Test Candidate",
      "Email Address": "testcandidate@example.com", 
      "Phone Number": "+1234567890",
      "Years of Experience": "3 years",
      "Location": "New York, NY"
    },
    fieldLabels: {
      "Full Name": "Full Name",
      "Email Address": "Email Address",
      "Phone Number": "Phone Number",
      "Years of Experience": "Years of Experience",
      "Location": "Location"
    }
  }

  try {
    console.log('Submitting test application...')
    const response = await fetch('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '8.8.8.8', // Simulate a real IP for testing
        'User-Agent': 'Test-Application-Bot/1.0'
      },
      body: JSON.stringify(testApplication)
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Application submitted successfully!')
      console.log('Application ID:', result.applicationId)
      
      // Now fetch the application to check if location was stored
      console.log('\nFetching application details...')
      const appResponse = await fetch(`http://localhost:3000/api/applications/${result.applicationId}`)
      const appData = await appResponse.json()
      
      console.log('\n📍 Location Data Check:')
      console.log('City:', appData.candidateCity)
      console.log('State:', appData.candidateState) 
      console.log('Country:', appData.candidateCountry)
      console.log('IP:', appData.candidateIP)
      console.log('Latitude:', appData.candidateLatitude)
      console.log('Longitude:', appData.candidateLongitude)
      
      if (appData.candidateCity && appData.candidateState && appData.candidateCountry) {
        console.log('✅ Geolocation data saved successfully!')
      } else {
        console.log('❌ Missing geolocation data')
      }
      
    } else {
      console.log('❌ Application submission failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

submitTestApplication()
