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

    const userCounts = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE role = 'CUSTOMER')::int AS total_customers,
        COUNT(*) FILTER (WHERE role = 'SELLER')::int AS total_sellers
      FROM users
    `)

    const orderCounts = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*)::int AS total_orders,
        COALESCE(SUM(grand_total_cents), 0)::bigint AS total_revenue_cents
      FROM orders
    `)

    const businessCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS total_businesses FROM businesses
    `)

    const productCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS total_products FROM products WHERE is_active = true
    `)

    const recentOrders = await prisma.$queryRawUnsafe(`
      SELECT o.id, o.status, o.grand_total_cents, o.created_at,
             u.full_name AS customer_name,
             b.name AS business_name
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      JOIN businesses b ON o.business_id = b.id
      ORDER BY o.created_at DESC
      LIMIT 8
    `)

    return success({
      totalUsers: userCounts[0].total_users,
      totalCustomers: userCounts[0].total_customers,
      totalSellers: userCounts[0].total_sellers,
      totalOrders: orderCounts[0].total_orders,
      totalRevenueCents: Number(orderCounts[0].total_revenue_cents),
      totalBusinesses: businessCount[0].total_businesses,
      totalProducts: productCount[0].total_products,
      recentOrders: recentOrders.map((o: any) => ({
        id: o.id,
        status: o.status,
        grandTotalCents: o.grand_total_cents,
        createdAt: o.created_at,
        customerName: o.customer_name,
        businessName: o.business_name,
      })),
    })
  } catch (err: any) {
    console.error('ADMIN STATS ERROR:', err?.message)
    return error('Failed to fetch admin stats: ' + err?.message, 500)
  }
}