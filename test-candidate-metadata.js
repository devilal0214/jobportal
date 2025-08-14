// Test script to check candidate metadata display
const applicationId = 'cmdzlgyk8000f5jy4j6kdm31y' // Most recent application

async function testCandidateMetadata() {
  try {
    console.log('🧪 Testing candidate metadata display...')
    
    const response = await fetch(`http://localhost:3000/api/applications/${applicationId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const application = await response.json()
    
    console.log('✅ Application fetched successfully')
    console.log('\n📋 Candidate Information:')
    console.log(`Name: ${application.candidateName}`)
    console.log(`Email: ${application.email}`)
    console.log(`Phone: ${application.phone || 'Not provided'}`)
    
    console.log('\n🌍 Location Metadata:')
    console.log(`IP Address: ${application.candidateIP || 'Not captured'}`)
    console.log(`City: ${application.candidateCity || 'Not captured'}`)
    console.log(`State: ${application.candidateState || 'Not captured'}`)
    console.log(`Country: ${application.candidateCountry || 'Not captured'}`)
    console.log(`Latitude: ${application.candidateLatitude || 'Not captured'}`)
    console.log(`Longitude: ${application.candidateLongitude || 'Not captured'}`)
    
    console.log('\n📝 Form Data Fields:')
    application.formData.forEach((field, index) => {
      console.log(`${index + 1}. ${field.label}: ${typeof field.value === 'object' ? JSON.stringify(field.value) : field.value}`)
    })
    
    console.log('\n✅ Metadata test completed!')
    console.log('🌐 Open http://localhost:3000/applications/' + applicationId + ' to view in browser')
    
  } catch (error) {
    console.error('❌ Error testing metadata:', error.message)
  }
}

testCandidateMetadata()
