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

    const body = await req.json()

    const title = body.title
    const description = body.description
    const priceInCents = body.priceInCents
    const comparePrice = body.comparePrice
    const inventoryCount = body.inventoryCount
    const sku = body.sku
    const brand = body.brand
    const category = body.category
    const tags = body.tags
    const imageUrls = body.imageUrls

    if (!title || !priceInCents) return error('Title and price are required')

    const businesses = await prisma.$queryRaw`
      SELECT id FROM businesses WHERE owner_id = ${user.id}::uuid LIMIT 1
    `
    const business = Array.isArray(businesses) ? businesses[0] : null
    if (!business) return error('Business not found', 404)

    let categoryId = null
    if (category) {
      const categories = await prisma.$queryRaw`
        SELECT id FROM categories WHERE name = ${category} LIMIT 1
      `
      const matchedCategory = Array.isArray(categories) ? categories[0] : null
      if (matchedCategory) categoryId = matchedCategory.id
    }

    const slug = slugify(title) + '-' + Date.now().toString().slice(-6)

    const finalDescription = description || null
    const finalComparePrice = comparePrice || null
    const finalInventoryCount = inventoryCount || 1
    const finalSku = sku || null
    const finalBrand = brand || null
    const finalTags = tags || []
    const finalImageUrls = imageUrls || []

    const product = await prisma.$queryRaw`
      INSERT INTO products (business_id, title, slug, description, price_in_cents, compare_price, inventory_count, sku, brand, category_id, tags, image_urls)
      VALUES (${business.id}::uuid, ${title}, ${slug}, ${finalDescription}, ${priceInCents}, ${finalComparePrice}, ${finalInventoryCount}, ${finalSku}, ${finalBrand}, ${categoryId}::uuid, ${finalTags}, ${finalImageUrls})
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