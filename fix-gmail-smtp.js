// Helper script to update Gmail SMTP settings with App Password
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateGmailSMTPSettings() {
  try {
    console.log('📧 Gmail SMTP Settings Update Helper\n')
    
    console.log('Current SMTP settings in database:')
    const currentSettings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['emailHost', 'emailPort', 'emailUser', 'emailPassword', 'emailFrom']
        }
      }
    })
    
    currentSettings.forEach(setting => {
      const displayValue = setting.key === 'emailPassword' ? '***HIDDEN***' : setting.value
      console.log(`${setting.key}: "${displayValue}"`)
    })
    
    console.log('\n🔧 To fix Gmail authentication:')
    console.log('================================')
    console.log('1. Enable 2-Factor Authentication on your Gmail account')
    console.log('2. Generate an App Password:')
    console.log('   - Go to https://myaccount.google.com/security')
    console.log('   - Click "2-Step Verification"')
    console.log('   - Scroll to "App passwords"')
    console.log('   - Generate password for "Mail"')
    console.log('   - Copy the 16-character password')
    console.log('')
    console.log('3. Update your admin settings with:')
    console.log('   - SMTP Host: smtp.gmail.com')
    console.log('   - SMTP Port: 587')
    console.log('   - Username: your-email@gmail.com')
    console.log('   - Password: [16-character app password]')
    console.log('   - From Email: your-email@gmail.com')
    console.log('')
    console.log('4. Test with SMTP Test form')
    console.log('')
    
    // Example of correct Gmail settings
    console.log('✅ Correct Gmail SMTP Settings:')
    console.log('==============================')
    console.log('Host: smtp.gmail.com')
    console.log('Port: 587')
    console.log('Security: TLS (not SSL)')
    console.log('Username: team@jaiveeru.co.in')
    console.log('Password: [App Password - 16 characters]')
    console.log('From Email: team@jaiveeru.co.in')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateGmailSMTPSettings()
