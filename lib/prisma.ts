/* eslint-disable @typescript-eslint/no-explicit-any */
// Prisma client singleton
// Requires: npx prisma generate (run once after cloning)

declare global {
  var prismaClient: any
}

function createPrismaClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    })
  } catch {
    console.warn('Prisma client not generated yet. Run: npx prisma generate')
    return null
  }
}

export const prisma: any = global.prismaClient ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prismaClient = prisma
}
