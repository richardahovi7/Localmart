import { verifyToken } from '@/lib/auth'
import { success, error } from '@/lib/response'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user || user.role !== 'ADMIN') return error('Unauthorized', 401)

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const url = new URL(req.url)
    const search = url.searchParams.get('search') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = 15
    const offset = (page - 1) * limit

    const conditions: string[] = ['1=1']
    const values: any[] = []

    if (search) {
      values.push(`%${search}%`)
      conditions.push(`b.name ILIKE $${values.length}`)
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS total FROM businesses b WHERE ${whereClause}`,
      ...values
    )
    const total = countResult[0].total

    values.push(limit)
    const limitParam = values.length
    values.push(offset)
    const offsetParam = values.length

    const businesses = await prisma.$queryRawUnsafe(
      `SELECT b.id, b.name, b.city, b.status, b.rating_avg, b.rating_count, b.created_at,
              u.full_name AS owner_name, u.email AS owner_email,
              (SELECT COUNT(*) FROM products p WHERE p.business_id = b.id AND p.is_active = true)::int AS product_count
       FROM businesses b
       JOIN users u ON b.owner_id = u.id
       WHERE ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      ...values
    )

    return success({
      businesses: businesses.map((b: any) => ({
        id: b.id,
        name: b.name,
        city: b.city,
        status: b.status,
        ratingAvg: b.rating_avg ? Number(b.rating_avg) : 0,
        ratingCount: b.rating_count,
        productCount: b.product_count,
        ownerName: b.owner_name,
        ownerEmail: b.owner_email,
        createdAt: b.created_at,
      })),
      total,
      pages: Math.ceil(total / limit),
      page,
    })
  } catch (err: any) {
    console.error('ADMIN BUSINESSES ERROR:', err?.message)
    return error('Failed to fetch businesses: ' + err?.message, 500)
  }
}