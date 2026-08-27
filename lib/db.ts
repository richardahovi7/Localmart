// Database client - uses dynamic import to avoid build-time errors
// Run `npx prisma generate` before starting the dev server

let _prisma: any = null

export async function getDb() {
  if (!_prisma) {
    const { PrismaClient } = await import('@prisma/client')
    _prisma = new PrismaClient()
  }
  return _prisma
}
