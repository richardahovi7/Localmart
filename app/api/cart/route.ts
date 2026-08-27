import { verifyToken } from '@/lib/auth'
import { success, error } from '@/lib/response'

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user) return error('Unauthorized', 401)

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const items = await prisma.$queryRawUnsafe(`
      SELECT
        ci.id,
        ci.quantity,
        p.id as "productId",
        p.title,
        p.price_in_cents as "priceInCents",
        p.image_urls as "imageUrls",
        p.inventory_count as "inventoryCount",
        b.id as "businessId",
        b.name as "businessName",
        b.offers_free_delivery as "offersFreeDelivery",
        b.delivery_fee_cents as "deliveryFeeCents"
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN businesses b ON p.business_id = b.id
      WHERE ci.customer_id = $1::uuid
      ORDER BY ci.created_at DESC
    `, user.id)

    const formatted = items.map((row: any) => ({
      id: row.id,
      quantity: row.quantity,
      product: {
        id: row.productId,
        title: row.title,
        priceInCents: row.priceInCents,
        imageUrls: row.imageUrls,
        inventoryCount: row.inventoryCount,
        business: {
          id: row.businessId,
          name: row.businessName,
          offersFreeDelivery: row.offersFreeDelivery,
          deliveryFeeCents: row.deliveryFeeCents,
        }
      }
    }))

    return success(formatted)
  } catch (err: any) {
    console.error('CART FETCH ERROR:', err?.message)
    return error('Failed to fetch cart: ' + err?.message, 500)
  }
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user) return error('Unauthorized', 401)

    const { productId, quantity } = await req.json()
    if (!productId) return error('productId is required')

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const existing = await prisma.$queryRawUnsafe(`
      SELECT id, quantity FROM cart_items
      WHERE customer_id = $1::uuid AND product_id = $2::uuid
      LIMIT 1
    `, user.id, productId)

    let result
    if (Array.isArray(existing) && existing.length > 0) {
      const newQty = existing[0].quantity + (quantity || 1)
      result = await prisma.$queryRawUnsafe(`
        UPDATE cart_items SET quantity = $1, updated_at = NOW()
        WHERE id = $2::uuid
        RETURNING *
      `, newQty, existing[0].id)
    } else {
      result = await prisma.$queryRawUnsafe(`
        INSERT INTO cart_items (customer_id, product_id, quantity)
        VALUES ($1::uuid, $2::uuid, $3)
        RETURNING *
      `, user.id, productId, quantity || 1)
    }

    return success(Array.isArray(result) ? result[0] : result, 201)
  } catch (err: any) {
    console.error('CART ADD ERROR:', err?.message)
    return error('Failed to add to cart: ' + err?.message, 500)
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user) return error('Unauthorized', 401)

    const { productId, quantity } = await req.json()
    if (!productId || quantity === undefined) return error('productId and quantity are required')

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const result = await prisma.$queryRawUnsafe(`
      UPDATE cart_items SET quantity = $1, updated_at = NOW()
      WHERE customer_id = $2::uuid AND product_id = $3::uuid
      RETURNING *
    `, quantity, user.id, productId)

    return success(Array.isArray(result) ? result[0] : result)
  } catch (err: any) {
    console.error('CART UPDATE ERROR:', err?.message)
    return error('Failed to update cart: ' + err?.message, 500)
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user) return error('Unauthorized', 401)

    const { productId } = await req.json()
    if (!productId) return error('productId is required')

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    await prisma.$queryRawUnsafe(`
      DELETE FROM cart_items
      WHERE customer_id = $1::uuid AND product_id = $2::uuid
    `, user.id, productId)

    return success({ deleted: true })
  } catch (err: any) {
    console.error('CART DELETE ERROR:', err?.message)
    return error('Failed to remove from cart: ' + err?.message, 500)
  }
}