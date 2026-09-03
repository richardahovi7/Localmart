import { hashPassword } from '@/lib/auth'
import { success, error } from '@/lib/response'
import { slugify } from '@/lib/slugify'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email, password, fullName, phone, role } = await req.json()

    if (!email || !password || !fullName) {
      return error('Email, password and full name are required')
    }
    if (password.length < 8) {
      return error('Password must be at least 8 characters')
    }

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return error('Email already in use', 409)

    const passwordHash = await hashPassword(password)
    const userRole = role === 'SELLER' ? 'SELLER' : 'CUSTOMER'

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const user = await prisma.$queryRaw`
      INSERT INTO users (email, password_hash, full_name, phone, role, is_verified, verification_code, verification_code_expires)
      VALUES (${email}, ${passwordHash}, ${fullName}, ${phone || null}, ${userRole}, false, ${verificationCode}, ${codeExpires})
      RETURNING id, email, full_name, role
    `

    const newUser = Array.isArray(user) ? user[0] : user

    if (userRole === 'SELLER') {
      const slug = slugify(fullName) + '-' + newUser.id.slice(0, 6)
      await prisma.$queryRaw`
        INSERT INTO businesses (owner_id, name, slug)
        VALUES (${newUser.id}::uuid, ${fullName + "'s Store"}, ${slug})
      `
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your LocalMart account',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #15803d;">Verify your email</h2>
          <p>Hi ${fullName},</p>
          <p>Welcome to LocalMart! Enter this code to verify your email address:</p>
          <div style="background: #f0fdf4; border: 2px solid #15803d; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #15803d;">${verificationCode}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
        </div>
      `,
    })

    return success({ email, requiresVerification: true }, 201)
  } catch (err: any) {
    console.error('REGISTER ERROR:', err?.message || err)
    return error('Registration failed: ' + (err?.message || 'Unknown error'), 500)
  }
}