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
    const status = url.searchParams.get('status') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = 15
    const offset = (page - 1) * limit

    const conditions: string[] = ['1=1']
    const values: any[] = []

    if (search) {
      values.push(`%${search}%`)
      conditions.push(`(u.full_name ILIKE $${values.length} OR b.name ILIKE $${values.length})`)
    }
    if (status) {
      values.push(status)
      conditions.push(`o.status = $${values.length}`)
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS total
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       JOIN businesses b ON o.business_id = b.id
       WHERE ${whereClause}`,
      ...values
    )
    const total = countResult[0].total

    values.push(limit)
    const limitParam = values.length
    values.push(offset)
    const offsetParam = values.length

    const orders = await prisma.$queryRawUnsafe(
      `SELECT o.id, o.status, o.grand_total_cents, o.created_at,
              u.full_name AS customer_name, u.email AS customer_email,
              b.name AS business_name
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       JOIN businesses b ON o.business_id = b.id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      ...values
    )

    return success({
      orders: orders.map((o: any) => ({
        id: o.id,
        status: o.status,
        grandTotalCents: o.grand_total_cents,
        createdAt: o.created_at,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        businessName: o.business_name,
      })),
      total,
      pages: Math.ceil(total / limit),
      page,
    })
  } catch (err: any) {
    console.error('ADMIN ORDERS ERROR:', err?.message)
    return error('Failed to fetch orders: ' + err?.message, 500)
  }
}