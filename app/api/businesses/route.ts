import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/response'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const where = {
      status: 'VERIFIED' as const,
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
      ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
      ...(categoryId && { categoryId }),
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }],
        select: {
          id: true, name: true, slug: true, logoUrl: true, bannerUrl: true,
          city: true, region: true, ratingAvg: true, ratingCount: true,
          isFeatured: true, category: { select: { name: true, slug: true } },
          _count: { select: { products: true } }
        }
      }),
      prisma.business.count({ where })
    ])

    return success({ businesses, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    console.error(err)
    return error('Failed to fetch businesses', 500)
  }
}
