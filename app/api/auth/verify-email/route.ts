import { signToken } from '@/lib/auth'
import { success, error } from '@/lib/response'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) return error('Email and code are required')

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const users = await prisma.$queryRawUnsafe(
      `SELECT id, email, full_name, role, verification_code, verification_code_expires, is_verified
       FROM users WHERE email = $1 LIMIT 1`,
      email
    )
    const user = Array.isArray(users) ? users[0] : null

    if (!user) return error('Account not found', 404)
    if (user.is_verified) return error('This account is already verified', 400)
    if (!user.verification_code || user.verification_code !== code) {
      return error('Invalid verification code', 400)
    }
    if (new Date(user.verification_code_expires) < new Date()) {
      return error('This code has expired. Please request a new one.', 400)
    }

    await prisma.$queryRawUnsafe(
      `UPDATE users SET is_verified = true, verification_code = NULL, verification_code_expires = NULL WHERE id = $1::uuid`,
      user.id
    )

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    return success({
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
      token,
    })
  } catch (err: any) {
    console.error('VERIFY EMAIL ERROR:', err?.message || err)
    return error('Verification failed: ' + (err?.message || 'Unknown error'), 500)
  }
}