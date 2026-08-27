import { success, error } from '@/lib/response'

export async function GET(req: Request) {
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '12')
    const offset = (page - 1) * limit
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || ''
    const brands = url.searchParams.get('brands') || '' // comma-separated
    const priceMin = url.searchParams.get('priceMin')
    const priceMax = url.searchParams.get('priceMax')
    const inStock = url.searchParams.get('inStock') === 'true'
    const outOfStock = url.searchParams.get('outOfStock') === 'true'
    const sort = url.searchParams.get('sort') || 'featured'

    const selectFields = `
      p.id,
      p.title,
      p.slug,
      p.description,
      p.price_in_cents as "priceInCents",
      p.compare_price as "comparePrice",
      p.inventory_count as "inventoryCount",
      p.image_urls as "imageUrls",
      p.rating_avg as "ratingAvg",
      p.rating_count as "ratingCount",
      p.brand,
      p.is_featured as "isFeatured",
      p.created_at as "createdAt",
      b.name as "businessName",
      c.name as "categoryName"
    `

    const conditions: string[] = ['p.is_active = true']
    const values: any[] = []

    if (search) {
      values.push('%' + search + '%')
      conditions.push(`p.title ILIKE $${values.length}`)
    }

    if (category && category !== 'All') {
      values.push(category)
      conditions.push(`c.name = $${values.length}`)
    }

    const brandList = brands.split(',').map(b => b.trim()).filter(Boolean)
    if (brandList.length > 0) {
      values.push(brandList)
      conditions.push(`p.brand = ANY($${values.length})`)
    }

    if (priceMin) {
      values.push(Math.round(parseFloat(priceMin) * 100))
      conditions.push(`p.price_in_cents >= $${values.length}`)
    }
    if (priceMax) {
      values.push(Math.round(parseFloat(priceMax) * 100))
      conditions.push(`p.price_in_cents <= $${values.length}`)
    }

    // Availability: both checked or neither checked = no filter. One checked = filter to that state.
    if (inStock && !outOfStock) {
      conditions.push(`p.inventory_count > 0`)
    } else if (outOfStock && !inStock) {
      conditions.push(`p.inventory_count = 0`)
    }

    const whereClause = conditions.join(' AND ')

    let orderBy = 'p.is_featured DESC, p.created_at DESC'
    if (sort === 'newest') orderBy = 'p.created_at DESC'
    else if (sort === 'price_asc') orderBy = 'p.price_in_cents ASC'
    else if (sort === 'price_desc') orderBy = 'p.price_in_cents DESC'
    else if (sort === 'rating') orderBy = 'p.rating_avg DESC NULLS LAST'

    const countResult = await prisma.$queryRawUnsafe(
      `
      SELECT COUNT(*)::int as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
    `,
      ...values
    )
    const total = Array.isArray(countResult) ? countResult[0].count : 0

    values.push(limit)
    const limitParam = values.length
    values.push(offset)
    const offsetParam = values.length

    const products = await prisma.$queryRawUnsafe(
      `
      SELECT ${selectFields}
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
      ...values
    )

    const productList = (Array.isArray(products) ? products : []).map((p: any) => ({
      ...p,
      ratingAvg: p.ratingAvg ? Number(p.ratingAvg) : 0,
      ratingCount: p.ratingCount || 0,
      category: p.categoryName ? { name: p.categoryName } : undefined,
    }))

    // Sidebar aggregate counts — computed against all active products, independent of current filters
    const categoryCounts = await prisma.$queryRawUnsafe(`
      SELECT c.name, COUNT(p.id)::int as count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      GROUP BY c.name
      ORDER BY count DESC
    `)

    const brandCounts = await prisma.$queryRawUnsafe(`
      SELECT p.brand, COUNT(p.id)::int as count
      FROM products p
      WHERE p.is_active = true AND p.brand IS NOT NULL AND p.brand != ''
      GROUP BY p.brand
      ORDER BY count DESC
      LIMIT 20
    `)

    const availabilityCounts = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) FILTER (WHERE inventory_count > 0)::int as "inStockCount",
        COUNT(*) FILTER (WHERE inventory_count = 0)::int as "outOfStockCount"
      FROM products
      WHERE is_active = true
    `)

    return success({
      products: productList,
      total,
      page,
      pages: Math.ceil(total / limit),
      categoryCounts,
      brandCounts,
      availabilityCounts: Array.isArray(availabilityCounts) ? availabilityCounts[0] : { inStockCount: 0, outOfStockCount: 0 },
    })
  } catch (err: any) {
    console.error('PRODUCTS FETCH ERROR:', err?.message)
    return error('Failed to fetch products: ' + err?.message, 500)
  }
}