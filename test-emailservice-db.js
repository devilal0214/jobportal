// Quick test to verify EmailService now reads from database
console.log('🧪 Testing EmailService Database Integration...\n')

// Import and test the EmailService
const { EmailService } = require('./src/lib/email.ts')

async function testEmailServiceSettings() {
  try {
    const emailService = new EmailService()
    
    // Try to send a test email to see what settings it uses
    console.log('Testing EmailService with database settings...')
    
    // This will trigger the getTransporter method and show settings
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'EmailService Test',
      html: '<p>Testing database settings integration</p>'
    })
    
    console.log('Test result:', result)
    
  } catch (error) {
    console.log('Expected error (test email):', error.message)
    console.log('Check the console logs above for EmailService settings!')
  }
}

testEmailServiceSettings()
