import { verifyToken } from '@/lib/auth'
import { success, error } from '@/lib/response'

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user || user.role !== 'SELLER') return error('Unauthorized', 401)

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const businesses = await prisma.$queryRawUnsafe(`
      SELECT
        id,
        name,
        offers_free_delivery as "offersFreeDelivery",
        delivery_fee_cents as "deliveryFeeCents"
      FROM businesses
      WHERE owner_id = $1::uuid
      LIMIT 1
    `, user.id)

    const business = Array.isArray(businesses) ? businesses[0] : null
    if (!business) return error('Business not found', 404)

    return success(business)
  } catch (err: any) {
    console.error('SELLER BUSINESS FETCH ERROR:', err?.message)
    return error('Failed to fetch business settings: ' + err?.message, 500)
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user || user.role !== 'SELLER') return error('Unauthorized', 401)

    const { offersFreeDelivery, deliveryFeeCents } = await req.json()

    if (typeof offersFreeDelivery !== 'boolean') {
      return error('offersFreeDelivery must be true or false')
    }
    if (!offersFreeDelivery && (typeof deliveryFeeCents !== 'number' || deliveryFeeCents < 0)) {
      return error('deliveryFeeCents must be a non-negative number when free delivery is off')
    }

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const businesses = await prisma.$queryRawUnsafe(`
      SELECT id FROM businesses WHERE owner_id = $1::uuid LIMIT 1
    `, user.id)
    const business = Array.isArray(businesses) ? businesses[0] : null
    if (!business) return error('Business not found', 404)

    const finalFeeCents = offersFreeDelivery ? 0 : deliveryFeeCents

    const result = await prisma.$queryRawUnsafe(`
      UPDATE businesses
      SET offers_free_delivery = $1, delivery_fee_cents = $2, updated_at = NOW()
      WHERE id = $3::uuid
      RETURNING
        id,
        offers_free_delivery as "offersFreeDelivery",
        delivery_fee_cents as "deliveryFeeCents"
    `, offersFreeDelivery, finalFeeCents, business.id)

    return success(Array.isArray(result) ? result[0] : result)
  } catch (err: any) {
    console.error('SELLER BUSINESS UPDATE ERROR:', err?.message)
    return error('Failed to update business settings: ' + err?.message, 500)
  }
}