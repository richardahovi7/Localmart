import { success, error } from '@/lib/response'
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
      `SELECT id, email, full_name, is_verified FROM users WHERE email = $1 LIMIT 1`,
      email
    )
    const user = Array.isArray(users) ? users[0] : null

    if (!user) return success({ sent: true }) // don't reveal whether the account exists
    if (user.is_verified) return error('This account is already verified', 400)

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.$queryRawUnsafe(
      `UPDATE users SET verification_code = $1, verification_code_expires = $2 WHERE id = $3::uuid`,
      verificationCode, codeExpires, user.id
    )

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: 'Your new LocalMart verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #15803d;">Your new verification code</h2>
          <p>Hi ${user.full_name || 'there'},</p>
          <div style="background: #f0fdf4; border: 2px solid #15803d; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #15803d;">${verificationCode}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
        </div>
      `,
    })

    return success({ sent: true })
  } catch (err: any) {
    console.error('RESEND VERIFICATION ERROR:', err?.message)
    return error('Failed to resend code', 500)
  }
}