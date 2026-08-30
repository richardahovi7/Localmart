import { success, error } from '@/lib/response'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json()
    if (!token || !newPassword) return error('Token and new password are required')
    if (newPassword.length < 6) return error('Password must be at least 6 characters')

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const users = await prisma.$queryRawUnsafe(
      `SELECT id, reset_token_expires FROM users WHERE reset_token = $1 LIMIT 1`,
      token
    )
    const user = Array.isArray(users) ? users[0] : null

    if (!user) return error('Invalid or expired reset link', 400)

    const expiresAt = new Date(user.reset_token_expires)
    if (expiresAt < new Date()) {
      return error('This reset link has expired. Please request a new one.', 400)
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.$queryRawUnsafe(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2::uuid`,
      passwordHash, user.id
    )

    return success({ reset: true })
  } catch (err: any) {
    console.error('RESET PASSWORD ERROR:', err?.message)
    return error('Failed to reset password: ' + err?.message, 500)
  }
}