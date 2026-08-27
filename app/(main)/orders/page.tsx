'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  READY: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-700 text-gray-700',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    setToken(t || null)
    if (t) {
      fetch('/api/orders', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(data => { if (data.success) setOrders(data.data) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  if (!token) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-2">Sign in to view your orders</h1>
      <Link href="/login" className="inline-block bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-600 mt-4">Sign In</Link>
    </div>
  )

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-700 h-28 rounded-xl" />)}
      </div>
    </div>
  )

  if (orders.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-4">📦</p>
      <h1 className="text-2xl font-bold mb-2">No orders yet</h1>
      <Link href="/products" className="inline-block bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-600 mt-2">Start Shopping</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-700 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-green-700">{order.businessName}</p>
                <p className="text-xs text-gray-700">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-700 text-gray-700'}`}>
                {order.status}
              </span>
            </div>
            <div className="border-t pt-3 space-y-1">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm text-gray-700">
                  <span>{item.title} x{item.quantity}</span>
                  <span>GH₵ {(item.totalCents / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3 flex justify-between font-semibold text-gray-700">
              <span>Total</span>
              <span>GH₵ {(order.grandTotalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}