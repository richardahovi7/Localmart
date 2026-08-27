import { hashPassword, signToken } from '@/lib/auth'
import { success, error } from '@/lib/response'
import { slugify } from '@/lib/slugify'

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

    const user = await prisma.$queryRaw`
      INSERT INTO users (email, password_hash, full_name, phone, role)
      VALUES (${email}, ${passwordHash}, ${fullName}, ${phone || null}, ${userRole})
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

    const token = signToken({ id: newUser.id, email: newUser.email, role: userRole })
    return success({ user: { ...newUser, fullName: newUser.full_name, role: userRole }, token }, 201)
  } catch (err: any) {
    console.error('REGISTER ERROR:', err?.message || err)
    return error('Registration failed: ' + (err?.message || 'Unknown error'), 500)
  }
}