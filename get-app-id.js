import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getAppId() {
  const app = await prisma.application.findFirst()
  console.log('Application ID:', app?.id)
  await prisma.$disconnect()
}

getAppId()
