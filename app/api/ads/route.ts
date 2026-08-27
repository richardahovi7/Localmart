import { success, error } from '@/lib/response'

export async function GET() {
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const ads = await prisma.$queryRaw`
      SELECT id, title, image_url as "imageUrl", link_url as "linkUrl"
      FROM ads
      WHERE is_active = true
      ORDER BY sort_order ASC, created_at ASC
    `

    return success(ads)
  } catch (err: any) {
    console.error('ADS FETCH ERROR:', err?.message)
    return error('Failed to fetch ads: ' + err?.message, 500)
  }
}