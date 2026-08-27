import { success, error } from '@/lib/response'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const result = await prisma.$queryRawUnsafe(`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.description,
        p.price_in_cents as "priceInCents",
        p.compare_price as "comparePrice",
        p.inventory_count as "inventoryCount",
        p.image_urls as "imageUrls",
        p.sku,
        p.tags,
        b.id as "businessId",
        b.name as "businessName"
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      WHERE p.id = $1::uuid
      LIMIT 1
    `, id)

    const product = Array.isArray(result) ? result[0] : null
    if (!product) return error('Product not found', 404)

    return success(product)
  } catch (err: any) {
    console.error('GET PRODUCT ERROR:', err?.message)
    return error('Failed to fetch product: ' + err?.message, 500)
  }
}