import { success, error } from '@/lib/response'
import crypto from 'crypto'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return error('Email is required')

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const users = await prisma.$queryRawUnsafe(
      `SELECT id, email, full_name FROM users WHERE email = $1 LIMIT 1`,
      email
    )
    const user = Array.isArray(users) ? users[0] : null

    // Always return success, even if the email doesn't exist —
    // this prevents attackers from using this endpoint to check which emails are registered
    if (!user) {
      return success({ sent: true })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    await prisma.$queryRawUnsafe(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3::uuid`,
      token, expires, user.id
    )

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: 'Reset your LocalMart password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #15803d;">Reset your password</h2>
          <p>Hi ${user.full_name || 'there'},</p>
          <p>We received a request to reset your LocalMart password. Click the button below to choose a new one. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #15803d; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Reset Password</a>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    return success({ sent: true })
  } catch (err: any) {
    console.error('FORGOT PASSWORD ERROR:', err?.message)
    return error('Failed to process request: ' + err?.message, 500)
  }
}