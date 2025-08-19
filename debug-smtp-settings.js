// Check current SMTP settings in database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSMTPSettings() {
  try {
    console.log('🔍 Checking SMTP settings in database...\n')

    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_email', 'smtp_secure']
        }
      }
    })

    console.log('📊 Database Settings:')
    console.log('=====================')
    settings.forEach(setting => {
      const displayValue = setting.key.includes('pass') ? '***HIDDEN***' : setting.value
      console.log(`${setting.key}: "${displayValue}"`)
    })

    console.log('\n🔧 Environment Variables:')
    console.log('==========================')
    const envVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL']
    envVars.forEach(varName => {
      const value = process.env[varName]
      const displayValue = varName.includes('PASS') ? '***HIDDEN***' : (value || 'NOT SET')
      console.log(`${varName}: "${displayValue}"`)
    })

    // Test the mapping logic
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    console.log('\n🧪 Settings Map Result:')
    console.log('========================')
    console.log('smtp_host:', settingsMap.smtp_host)
    console.log('smtp_user:', settingsMap.smtp_user)
    console.log('Has both?', !!(settingsMap.smtp_host && settingsMap.smtp_user))

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSMTPSettings()
