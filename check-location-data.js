const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkLocationData() {
  try {
    console.log('🔍 Checking location data in applications...')
    
    const applications = await prisma.application.findMany({
      select: {
        id: true,
        candidateName: true,
        candidateCity: true,
        candidateState: true,
        candidateCountry: true,
        candidateLatitude: true,
        candidateLongitude: true,
        candidateIP: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    console.log(`Found ${applications.length} recent applications:`)
    
    applications.forEach((app, index) => {
      console.log(`\n${index + 1}. ${app.candidateName} (ID: ${app.id})`)
      console.log(`   IP: ${app.candidateIP || 'Not set'}`)
      console.log(`   City: ${app.candidateCity || 'Not set'}`)
      console.log(`   State: ${app.candidateState || 'Not set'}`)
      console.log(`   Country: ${app.candidateCountry || 'Not set'}`)
      console.log(`   Coordinates: ${app.candidateLatitude && app.candidateLongitude ? `${app.candidateLatitude}, ${app.candidateLongitude}` : 'Not set'}`)
      console.log(`   Applied: ${app.createdAt.toLocaleString()}`)
    })

  } catch (error) {
    console.error('❌ Error checking location data:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkLocationData()
