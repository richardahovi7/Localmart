import { verifyToken } from '@/lib/auth'
import { success, error } from '@/lib/response'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user || user.role !== 'ADMIN') return error('Unauthorized', 401)

    const { id } = await params
    const { title, imageUrl, linkUrl, isActive, sortOrder } = await req.json()

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const ad = await prisma.$queryRaw`
      UPDATE ads
      SET title = COALESCE(${title}, title),
          image_url = COALESCE(${imageUrl}, image_url),
          link_url = ${linkUrl !== undefined ? linkUrl : prisma.$queryRaw`link_url`},
          is_active = COALESCE(${isActive}, is_active),
          sort_order = COALESCE(${sortOrder}, sort_order),
          updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `

    return success(Array.isArray(ad) ? ad[0] : ad)
  } catch (err: any) {
    console.error('ADMIN AD UPDATE ERROR:', err?.message)
    return error('Failed to update ad: ' + err?.message, 500)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return error('Unauthorized', 401)
    const user = verifyToken(auth.replace('Bearer ', ''))
    if (!user || user.role !== 'ADMIN') return error('Unauthorized', 401)

    const { id } = await params

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    await prisma.$queryRaw`DELETE FROM ads WHERE id = ${id}::uuid`

    return success({ deleted: true })
  } catch (err: any) {
    console.error('ADMIN AD DELETE ERROR:', err?.message)
    return error('Failed to delete ad: ' + err?.message, 500)
  }
}