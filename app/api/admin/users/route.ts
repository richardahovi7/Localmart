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
    const role = url.searchParams.get('role') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = 15
    const offset = (page - 1) * limit

    const conditions: string[] = ['1=1']
    const values: any[] = []

    if (search) {
      values.push(`%${search}%`)
      conditions.push(`(full_name ILIKE $${values.length} OR email ILIKE $${values.length})`)
    }
    if (role) {
      values.push(role)
      conditions.push(`role = $${values.length}`)
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS total FROM users WHERE ${whereClause}`,
      ...values
    )
    const total = countResult[0].total

    values.push(limit)
    const limitParam = values.length
    values.push(offset)
    const offsetParam = values.length

    const users = await prisma.$queryRawUnsafe(
      `SELECT id, email, full_name, phone, role, is_active, is_verified, created_at
       FROM users
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      ...values
    )

    return success({
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        phone: u.phone,
        role: u.role,
        isActive: u.is_active,
        isVerified: u.is_verified,
        createdAt: u.created_at,
      })),
      total,
      pages: Math.ceil(total / limit),
      page,
    })
  } catch (err: any) {
    console.error('ADMIN USERS ERROR:', err?.message)
    return error('Failed to fetch users: ' + err?.message, 500)
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const admin = verifyToken(auth.replace('Bearer ', ''))
    if (!admin || admin.role !== 'ADMIN') return error('Unauthorized', 401)

    const { userId, isActive } = await req.json()
    if (!userId || typeof isActive !== 'boolean') {
      return error('userId and isActive are required')
    }

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    await prisma.$queryRawUnsafe(
      `UPDATE users SET is_active = $1 WHERE id = $2::uuid`,
      isActive, userId
    )

    return success({ updated: true })
  } catch (err: any) {
    console.error('ADMIN USER UPDATE ERROR:', err?.message)
    return error('Failed to update user: ' + err?.message, 500)
  }
}