import { verifyPassword, signToken } from '@/lib/auth'
import { success, error } from '@/lib/response'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return error('Email and password required')

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const users = await prisma.$queryRaw`
      SELECT id, email, full_name, role, password_hash, is_active, is_verified, avatar_url
      FROM users WHERE email = ${email} LIMIT 1
    `

    const user = Array.isArray(users) ? users[0] : null
    if (!user || !user.is_active) return error('Invalid credentials', 401)

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) return error('Invalid credentials', 401)

    if (!user.is_verified) {
      return error('UNVERIFIED:' + user.email, 403)
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })
    return success({
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, avatarUrl: user.avatar_url },
      token
    })
  } catch (err: any) {
    console.error('LOGIN ERROR:', err?.message || err)
    return error('Login failed: ' + (err?.message || 'Unknown error'), 500)
  }
}