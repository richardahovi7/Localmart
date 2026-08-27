export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN'
export type BusinessStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type PaymentMethod = 'MOBILE_MONEY' | 'CARD' | 'CASH_ON_DELIVERY' | 'BANK_TRANSFER'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string | null
}

export interface ProductCard {
  id: string
  title: string
  slug: string
  priceInCents: number
  comparePrice?: number | null
  imageUrls: string[]
  ratingAvg: number
  ratingCount: number
  business: {
    id: string
    name: string
    slug: string
    city?: string | null
  }
}

export interface CartItemWithProduct {
  id: string
  quantity: number
  product: {
    id: string
    title: string
    priceInCents: number
    imageUrls: string[]
    inventoryCount: number
    business: { name: string }
  }
}
