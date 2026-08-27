import { verifyToken } from '@/lib/auth'
import { success, error } from '@/lib/response'
import { slugify } from '@/lib/slugify'

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user || user.role !== 'SELLER') return error('Unauthorized', 401)

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const { title, description, priceInCents, comparePrice, inventoryCount, sku, tags } = await req.json()
    if (!title || !priceInCents) return error('Title and price are required')

    const businesses = await prisma.$queryRaw`
      SELECT id FROM businesses WHERE owner_id = ${user.id}::uuid LIMIT 1
    `
    const business = Array.isArray(businesses) ? businesses[0] : null
    if (!business) return error('Business not found', 404)

    const slug = slugify(title) + '-' + Date.now().toString().slice(-6)

    const product = await prisma.$queryRaw`
      INSERT INTO products (business_id, title, slug, description, price_in_cents, compare_price, inventory_count, sku, tags, image_urls)
      VALUES (${business.id}::uuid, ${title}, ${slug}, ${description || null}, ${priceInCents}, ${comparePrice || null}, ${inventoryCount || 1}, ${sku || null}, ${tags || []}, '{}')
      RETURNING *
    `

    return success(Array.isArray(product) ? product[0] : product, 201)
  } catch (err: any) {
    console.error('ADD PRODUCT ERROR:', err?.message)
    return error('Failed to add product: ' + err?.message, 500)
  }
}

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user) return error('Unauthorized', 401)

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const products = await prisma.$queryRaw`
      SELECT p.*, b.name as business_name
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      WHERE b.owner_id = ${user.id}::uuid
      ORDER BY p.created_at DESC
    `

    return success(products)
  } catch (err: any) {
    return error('Failed to fetch products: ' + err?.message, 500)
  }
}