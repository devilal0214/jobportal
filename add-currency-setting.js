const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Adding currency setting...\n')

  // Add default currency setting
  await prisma.settings.upsert({
    where: { key: 'default_currency' },
    update: { value: '₹' },
    create: {
      key: 'default_currency',
      value: '₹',
      type: 'text'
    }
  })

  console.log('✅ Currency setting added (default: ₹ Rupee)\n')
  console.log('You can change this in Settings to $ (Dollar), € (Euro), £ (Pound), etc.')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
