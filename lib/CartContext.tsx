'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface CartContextValue {
  cartCount: number
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue>({
  cartCount: 0,
  refreshCart: async () => {},
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0)

  const refreshCart = useCallback(async () => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (!token) {
      setCartCount(0)
      return
    }
    try {
      const res = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        const total = data.data.reduce((sum: number, item: any) => sum + item.quantity, 0)
        setCartCount(total)
      }
    } catch (err) {
      console.error('Cart refresh error:', err)
    }
  }, [])

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}