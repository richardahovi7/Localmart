'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, Trash2, CheckCircle2, Truck, Lock, ShieldCheck } from 'lucide-react'
import { useCart } from '@/lib/CartContext'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    title: string
    priceInCents: number
    imageUrls: string[]
    inventoryCount: number
    business: {
      id: string
      name: string
      offersFreeDelivery: boolean
      deliveryFeeCents: number
    }
  }
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const { refreshCart } = useCart()

  useEffect(() => {
    const t = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    setToken(t || null)

    if (t) {
      fetch('/api/cart', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(data => { if (data.success) setItems(data.data) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function updateQty(productId: string, delta: number) {
    const item = items.find(i => i.product.id === productId)
    if (!item) return
    const newQty = item.quantity + delta

    if (newQty <= 0) {
      await removeItem(productId)
      return
    }

    const res = await fetch('/api/cart', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: newQty })
    })
    const data = await res.json()
    if (data.success) {
      setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: newQty } : i))
      refreshCart()
    }
  }

  async function removeItem(productId: string) {
    const res = await fetch('/api/cart', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    })
    const data = await res.json()
    if (data.success) {
      setItems(prev => prev.filter(i => i.product.id !== productId))
      refreshCart()
    }
  }

  async function clearCart() {
    if (!token || items.length === 0) return
    setClearing(true)
    try {
      await Promise.all(
        items.map(item =>
          fetch('/api/cart', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item.product.id })
          })
        )
      )
      setItems([])
      refreshCart()
    } finally {
      setClearing(false)
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.product.priceInCents * i.quantity, 0)

  const vendorDeliveryFees = new Map<string, { feeCents: number; free: boolean }>()
  for (const item of items) {
    const b = item.product.business
    if (!vendorDeliveryFees.has(b.id)) {
      vendorDeliveryFees.set(b.id, {
        feeCents: b.offersFreeDelivery ? 0 : b.deliveryFeeCents,
        free: b.offersFreeDelivery,
      })
    }
  }
  const vendorFeesList = Array.from(vendorDeliveryFees.values())
  const totalDeliveryCents = vendorFeesList.reduce((sum, v) => sum + v.feeCents, 0)
  const allFree = vendorFeesList.length > 0 && vendorFeesList.every(v => v.free)

  const total = subtotal + totalDeliveryCents

  if (!token) return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">Sign in to see your cart or start shopping</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="bg-green-700 text-white px-6 py-3 rounded-lg">Log in</Link>
          <Link href="/products" className="border border-gray-300 text-gray-900 px-6 py-3 rounded-lg">Browse products</Link>
        </div>
      </div>
    </div>
  )

  if (loading) return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 h-24 rounded-xl" />)}
        </div>
      </div>
    </div>
  )

  if (items.length === 0) return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Your cart is empty</h1>
        <Link href="/products" className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg">Browse products</Link>
      </div>
    </div>
  )

  return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Your Cart ({items.length})</h1>
          <Link href="/products" className="flex items-center gap-1.5 text-sm text-green-700 hover:underline font-medium">
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>
        <p className="text-gray-500 text-sm mb-6">Review your items and proceed to checkout.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Product</span>
                <span className="text-right">Price</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Subtotal</span>
                <span></span>
              </div>

              {items.map(item => {
                const inStock = item.product.inventoryCount > 0
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 border-b border-gray-50 last:border-0 items-center"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.imageUrls[0] || 'https://placehold.co/64x64?text=?'}
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded-lg bg-gray-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.product.title}</p>
                        <p className="text-xs text-gray-400">{item.product.business.name}</p>
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${inStock ? 'text-green-700' : 'text-red-500'}`}>
                          {inStock && <CheckCircle2 size={12} />}
                          {inStock ? 'In Stock' : 'Out of Stock'}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-900 sm:text-right">GH₵ {(item.product.priceInCents / 100).toFixed(2)}</p>

                    <div className="flex sm:justify-center">
                      <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden">
                        <button onClick={() => updateQty(item.product.id, -1)} className="p-2 hover:bg-gray-100 text-gray-700">
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-sm text-gray-900 font-medium">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="p-2 hover:bg-gray-100 text-gray-700">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="font-semibold text-gray-900 sm:text-right">
                      GH₵ {(item.product.priceInCents * item.quantity / 100).toFixed(2)}
                    </p>

                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="justify-self-end text-gray-400 hover:text-red-500 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}

              <div className="flex items-center justify-end px-5 py-4">
                <button
                  onClick={clearCart}
                  disabled={clearing}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:underline disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {clearing ? 'Clearing...' : 'Clear Cart'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-20">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                  <span className="font-medium text-gray-900">GH₵ {(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className={`font-medium ${allFree ? 'text-green-700' : 'text-gray-900'}`}>
                    {allFree ? 'FREE' : `GH₵ ${(totalDeliveryCents / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-4 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-green-700 text-lg">GH₵ {(total / 100).toFixed(2)}</span>
              </div>

              {allFree && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-2.5 mb-4">
                  <Truck size={18} className="text-green-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">You're eligible for FREE delivery!</p>
                    <p className="text-xs text-green-700 mt-0.5">No delivery charges on this order.</p>
                  </div>
                </div>
              )}

              <Link
                href="/checkout"
                className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <Lock size={16} />
              </Link>

              <div className="flex items-start gap-2 text-xs text-gray-500 mt-4">
                <ShieldCheck size={16} className="text-green-700 shrink-0 mt-0.5" />
                <p>Secure checkout. Your payment information is safe with us.</p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">We accept:</p>
                <div className="flex flex-wrap gap-2">
                  {['Visa', 'Mastercard', 'MTN MoMo', 'PayPal'].map(method => (
                    <span key={method} className="text-[11px] font-medium text-gray-600 border border-gray-200 rounded px-2 py-1">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}