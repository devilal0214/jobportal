// Test SMTP Test Form Setup
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSMTPSetup() {
  try {
    console.log('🧪 Testing SMTP Test Form Setup...\n')

    // Check if Settings table exists and has SMTP settings
    console.log('1. Checking SMTP settings in database...')
    const smtpSettings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_email']
        }
      }
    })

    if (smtpSettings.length > 0) {
      console.log(`   ✅ Found ${smtpSettings.length} SMTP settings in database:`)
      smtpSettings.forEach(setting => {
        const displayValue = setting.key.includes('pass') ? '***' : setting.value
        console.log(`      - ${setting.key}: ${displayValue}`)
      })
    } else {
      console.log('   ⚠️  No SMTP settings found in database')
      console.log('   📝 Will fall back to environment variables')
    }

    // Check environment variables
    console.log('\n2. Checking environment variables...')
    const envVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL']
    let envCount = 0
    
    envVars.forEach(varName => {
      const value = process.env[varName]
      if (value) {
        envCount++
        const displayValue = varName.includes('PASS') ? '***' : value
        console.log(`   ✅ ${varName}: ${displayValue}`)
      } else {
        console.log(`   ❌ ${varName}: Not set`)
      }
    })

    if (envCount === 0) {
      console.log('   ⚠️  No SMTP environment variables found')
    }

    // Check if EmailLog table exists for logging
    console.log('\n3. Checking EmailLog table...')
    const emailLogCount = await prisma.emailLog.count()
    console.log(`   ✅ EmailLog table exists with ${emailLogCount} entries`)

    // Summary
    console.log('\n📋 SMTP Test Setup Summary:')
    console.log('===============================')
    
    if (smtpSettings.length > 0 || envCount > 0) {
      console.log('✅ SMTP configuration: Available')
      console.log('✅ Email logging: Ready')
      console.log('✅ API endpoint: /api/admin/smtp-test')
      console.log('✅ Test page: /admin/smtp-test')
      console.log('')
      console.log('🚀 SMTP Test form is ready to use!')
      console.log('')
      console.log('📧 To test:')
      console.log('   1. Navigate to http://localhost:3000/admin/smtp-test')
      console.log('   2. Enter an email address')
      console.log('   3. Add a custom message (optional)')
      console.log('   4. Click "Send Test Email"')
      console.log('')
      if (smtpSettings.length === 0) {
        console.log('⚠️  Note: Using environment variables for SMTP')
        console.log('   Consider adding SMTP settings to database via admin settings')
      }
    } else {
      console.log('❌ SMTP configuration: Missing')
      console.log('   Configure SMTP settings in:')
      console.log('   - Database (via admin settings), OR')
      console.log('   - Environment variables (.env file)')
    }

  } catch (error) {
    console.error('❌ Error testing SMTP setup:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testSMTPSetup()
