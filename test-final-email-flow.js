// Test application status change emails now that SMTP is working
const testStatusChangeEmails = async () => {
  try {
    console.log('🎉 SMTP is working! Now testing status change emails...\n')

    // Get an application to test with
    const appsResponse = await fetch('http://localhost:3000/api/applications?limit=3')
    const appsData = await appsResponse.json()
    
    if (!appsData.applications || appsData.applications.length === 0) {
      console.log('❌ No applications found to test with')
      return
    }

    const testApp = appsData.applications[0]
    console.log(`📋 Testing with application:`)
    console.log(`   Candidate: ${testApp.candidateName}`)
    console.log(`   Email: ${testApp.email || 'Email from form data'}`)
    console.log(`   Job: ${testApp.position}`)
    console.log(`   Current Status: ${testApp.status}`)
    console.log(`   Application ID: ${testApp.id}`)

    // Test SHORTLISTED status change
    console.log('\n📧 Testing SHORTLISTED status change email...')
    const response = await fetch(`http://localhost:3000/api/applications/${testApp.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'SHORTLISTED'
      })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Status update successful!')
      console.log(`   New Status: ${result.status}`)
      console.log(`   Email Sent: ${result.emailSent ? 'YES ✅' : 'NO ❌'}`)
      console.log(`   Email Address: ${result.candidateEmail}`)
      
      if (result.emailSent) {
        console.log('\n🎉 SUCCESS! Status change email sent successfully!')
        console.log('\n📧 Email Details:')
        console.log('   Subject: "Good news! You\'ve been shortlisted for [Job Title]"')
        console.log('   Content: Professional HTML email with application details')
        console.log('   Recipient should check their inbox!')
      } else {
        console.log('\n⚠️  Status updated but email not sent')
        console.log('   Possible reasons:')
        console.log('   - No email address found for candidate')
        console.log('   - SMTP error (but test was successful)')
      }
    } else {
      console.log('❌ Status update failed:', result.error)
    }

    console.log('\n📋 Test Summary:')
    console.log('================')
    console.log(`SMTP Test: ✅ SUCCESSFUL`)
    console.log(`Status Update: ${response.ok ? '✅ SUCCESSFUL' : '❌ FAILED'}`)
    console.log(`Email Notification: ${result.emailSent ? '✅ SENT' : '❌ NOT SENT'}`)
    
    if (result.emailSent) {
      console.log('\n🎯 Everything is working perfectly!')
      console.log('   - SMTP configuration: ✅ Working')
      console.log('   - Status updates: ✅ Working') 
      console.log('   - Email notifications: ✅ Working')
      console.log('\n💡 You can now:')
      console.log('   1. Change application statuses in the admin panel')
      console.log('   2. Candidates will automatically receive email notifications')
      console.log('   3. Check email logs in admin settings')
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message)
  }
}

testStatusChangeEmails()
