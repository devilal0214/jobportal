// Check SMTP settings with both naming conventions
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAllSMTPSettings() {
  try {
    console.log('🔍 Checking ALL SMTP-related settings in database...\n')

    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: [
            // Snake case (old format)
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_email', 'smtp_secure',
            // Camel case (current format)  
            'emailHost', 'emailPort', 'emailUser', 'emailPassword', 'emailFrom', 'emailFromName'
          ]
        }
      }
    })

    console.log('📊 All SMTP Settings Found:')
    console.log('============================')
    
    if (settings.length === 0) {
      console.log('❌ No SMTP settings found in database!')
    } else {
      settings.forEach(setting => {
        const displayValue = setting.key.toLowerCase().includes('pass') ? '***HIDDEN***' : setting.value
        console.log(`${setting.key}: "${displayValue}"`)
      })
    }

    // Check if any settings exist at all
    console.log('\n🔍 Checking ALL settings in database...')
    const allSettings = await prisma.settings.findMany()
    console.log(`Total settings in database: ${allSettings.length}`)
    
    if (allSettings.length > 0) {
      console.log('\nAll setting keys:')
      allSettings.forEach(setting => {
        console.log(`- ${setting.key}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllSMTPSettings()
