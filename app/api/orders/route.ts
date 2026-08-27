import { verifyToken } from '@/lib/auth'
import { success, error } from '@/lib/response'
import { createNotification } from '@/lib/notifications'

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user) return error('Unauthorized', 401)

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const orders = await prisma.$queryRawUnsafe(`
      SELECT o.*, b.name as "businessName"
      FROM orders o
      JOIN businesses b ON o.business_id = b.id
      WHERE o.customer_id = $1::uuid
      ORDER BY o.created_at DESC
    `, user.id)

    const orderIds = orders.map((o: any) => o.id)
    let items: any[] = []
    if (orderIds.length > 0) {
      items = await prisma.$queryRawUnsafe(`
        SELECT oi.*, p.title
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ANY($1::uuid[])
      `, orderIds)
    }

    const formatted = orders.map((o: any) => ({
      id: o.id,
      status: o.status,
      grandTotalCents: o.grand_total_cents,
      createdAt: o.created_at,
      businessName: o.businessName,
      items: items.filter(i => i.order_id === o.id).map(i => ({
        title: i.title,
        quantity: i.quantity,
        totalCents: i.total_cents
      }))
    }))

    return success(formatted)
  } catch (err: any) {
    console.error('GET ORDERS ERROR:', err?.message)
    return error('Failed to fetch orders: ' + err?.message, 500)
  }

}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user) return error('Unauthorized', 401)

    const { deliveryAddress, deliveryNotes } = await req.json()

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const cartItems = await prisma.$queryRawUnsafe(`
      SELECT
        ci.id as "cartItemId",
        ci.quantity,
        p.id as "productId",
        p.title,
        p.price_in_cents as "priceInCents",
        p.business_id as "businessId",
        p.inventory_count as "inventoryCount"
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.customer_id = $1::uuid
    `, user.id)

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return error('Cart is empty', 400)
    }

    const groupedByBusiness: Record<string, any[]> = {}
    for (const item of cartItems) {
      if (!groupedByBusiness[item.businessId]) groupedByBusiness[item.businessId] = []
      groupedByBusiness[item.businessId].push(item)
    }

    const createdOrders = []

    for (const businessId of Object.keys(groupedByBusiness)) {
      const items = groupedByBusiness[businessId]
      const totalCents = items.reduce((sum, i) => sum + i.priceInCents * i.quantity, 0)
      const grandTotalCents = totalCents

      const orderResult = await prisma.$queryRawUnsafe(`
        INSERT INTO orders (customer_id, business_id, status, total_cents, discount_cents, delivery_cents, grand_total_cents, delivery_address, delivery_notes)
        VALUES ($1::uuid, $2::uuid, 'PENDING', $3, 0, 0, $4, $5, $6)
        RETURNING *
      `, user.id, businessId, totalCents, grandTotalCents, deliveryAddress || null, deliveryNotes || null)

      const order = Array.isArray(orderResult) ? orderResult[0] : orderResult

      for (const item of items) {
        await prisma.$queryRawUnsafe(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, total_cents, product_snapshot)
          VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb)
        `, order.id, item.productId, item.quantity, item.priceInCents, item.priceInCents * item.quantity, JSON.stringify({ title: item.title }))
      }

      // Notify the seller (business owner) of the new order
      const businessResult = await prisma.$queryRawUnsafe(`
        SELECT owner_id, name FROM businesses WHERE id = $1::uuid
      `, businessId)
      const business = Array.isArray(businessResult) ? businessResult[0] : businessResult

      if (business?.owner_id) {
        await createNotification({
          userId: business.owner_id,
          type: 'NEW_ORDER',
          title: 'New order received',
          body: `You have a new order for GH₵ ${(grandTotalCents / 100).toFixed(2)}.`,
          data: { orderId: order.id, grandTotalCents },
        })
      }

      createdOrders.push(order)
    }

    await prisma.$queryRawUnsafe(`
      DELETE FROM cart_items WHERE customer_id = $1::uuid
    `, user.id)

    return success({ orders: createdOrders }, 201)
  } catch (err: any) {
    console.error('CREATE ORDER ERROR:', err?.message)
    return error('Failed to place order: ' + err?.message, 500)
  }
}