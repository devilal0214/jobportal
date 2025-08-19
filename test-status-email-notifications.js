// Test application status update with email notifications
const testStatusUpdateWithEmail = async () => {
  try {
    console.log('🧪 Testing Application Status Update with Email Notifications...\n')

    // First, get an application to test with
    console.log('1. Fetching applications...')
    const appsResponse = await fetch('http://localhost:3000/api/applications?limit=5')
    const appsData = await appsResponse.json()
    
    if (!appsData.applications || appsData.applications.length === 0) {
      console.log('❌ No applications found to test with')
      return
    }

    const testApp = appsData.applications[0]
    console.log(`   ✅ Found application: ${testApp.candidateName} (${testApp.id})`)
    console.log(`   📧 Email: ${testApp.email || 'Not found in list'}`)
    console.log(`   🏢 Job: ${testApp.position}`)
    console.log(`   📊 Current Status: ${testApp.status}`)

    // Test updating to SHORTLISTED status
    console.log('\n2. Testing status update to SHORTLISTED...')
    const updateResponse = await fetch(`http://localhost:3000/api/applications/${testApp.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'SHORTLISTED'
      })
    })

    const updateResult = await updateResponse.json()
    
    if (updateResponse.ok) {
      console.log('   ✅ Status update successful!')
      console.log(`   📊 New Status: ${updateResult.status}`)
      console.log(`   📧 Email Sent: ${updateResult.emailSent ? 'YES' : 'NO'}`)
      console.log(`   📮 Email Address: ${updateResult.candidateEmail}`)
      
      if (updateResult.emailSent) {
        console.log('   🎉 Email notification sent successfully!')
      } else {
        console.log('   ⚠️  Email notification was not sent')
        console.log('   💡 Check SMTP configuration and candidate email address')
      }
    } else {
      console.log('   ❌ Status update failed:', updateResult.error)
    }

    // Check email logs
    console.log('\n3. Checking recent email logs...')
    try {
      // This would require a separate endpoint to check logs
      // For now we'll just suggest manual verification
      console.log('   💡 To verify email delivery:')
      console.log('   - Check the email inbox for:', updateResult.candidateEmail)
      console.log('   - Look for subject: "Good news! You\'ve been shortlisted for [Job Title]"')
      console.log('   - Check admin panel email logs')
    } catch (logError) {
      console.log('   ⚠️  Could not check email logs automatically')
    }

    console.log('\n📋 Test Summary:')
    console.log('================')
    console.log(`Application ID: ${testApp.id}`)
    console.log(`Candidate: ${testApp.candidateName}`) 
    console.log(`Status Update: ${updateResponse.ok ? 'SUCCESS' : 'FAILED'}`)
    console.log(`Email Sent: ${updateResult.emailSent ? 'YES' : 'NO'}`)
    console.log(`Email Address: ${updateResult.candidateEmail}`)

  } catch (error) {
    console.error('❌ Test Error:', error.message)
  }
}

// Also test with different statuses
const testAllStatusUpdates = async () => {
  console.log('\n🔄 Testing All Status Update Email Types...\n')
  
  const statuses = ['SHORTLISTED', 'SELECTED', 'REJECTED', 'UNDER_REVIEW']
  
  // Get applications to test with
  const appsResponse = await fetch('http://localhost:3000/api/applications?limit=4')
  const appsData = await appsResponse.json()
  
  if (!appsData.applications || appsData.applications.length === 0) {
    console.log('❌ No applications found')
    return
  }

  for (let i = 0; i < Math.min(statuses.length, appsData.applications.length); i++) {
    const status = statuses[i]
    const app = appsData.applications[i]
    
    console.log(`${i + 1}. Testing ${status} for ${app.candidateName}...`)
    
    try {
      const response = await fetch(`http://localhost:3000/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const result = await response.json()
      
      if (response.ok) {
        console.log(`   ✅ ${status}: Email ${result.emailSent ? 'SENT' : 'FAILED'} to ${result.candidateEmail}`)
      } else {
        console.log(`   ❌ ${status}: Update failed - ${result.error}`)
      }
    } catch (error) {
      console.log(`   ❌ ${status}: Error - ${error.message}`)
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// Run the tests
console.log('📧 Application Status Email Notification Test')
console.log('==============================================')

testStatusUpdateWithEmail().then(() => {
  return testAllStatusUpdates()
}).then(() => {
  console.log('\n✅ All tests completed!')
  console.log('\n💡 Manual Verification Steps:')
  console.log('1. Check email inboxes for notification emails')
  console.log('2. Verify email content and formatting')
  console.log('3. Check admin panel email logs') 
  console.log('4. Test with different SMTP configurations if needed')
})
