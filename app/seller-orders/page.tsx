'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SEQUENCE = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"]

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  READY: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
}

interface OrderItem {
  id: string
  title: string
  quantity: number
  unitPriceCents: number
}

interface Order {
  id: string
  status: string
  grand_total_cents: number
  customerName: string
  customerPhone: string
  delivery_address: string | null
  created_at: string
  items: OrderItem[]
}

export default function SellerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    setToken(t || null)
    if (!t) { router.push('/login'); return }

    fetch('/api/seller/orders', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setOrders(data.data) })
      .finally(() => setLoading(false))
  }, [router])

  async function updateStatus(orderId: string, action: 'advance' | 'cancel') {
    if (!token) return
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: data.data.status } : o))
    } catch (err: any) {
      alert('Failed to update order: ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  function nextStatusLabel(status: string) {
    const idx = SEQUENCE.indexOf(status)
    if (idx === -1 || idx === SEQUENCE.length - 1) return null
    return SEQUENCE[idx + 1]
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 h-32 rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <Link href="/dashboard" className="text-sm text-green-700 hover:underline">← Back to Dashboard</Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const next = nextStatusLabel(order.status)
              const canCancel = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)

              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerPhone}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mb-3 space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-700">
                        <span>{item.quantity}x {item.title}</span>
                        <span>GH₵ {((item.unitPriceCents * item.quantity) / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <p className="font-bold text-gray-900">
                      Total: GH₵ {(order.grand_total_cents / 100).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      {canCancel && (
                        <button
                          onClick={() => updateStatus(order.id, 'cancel')}
                          disabled={updatingId === order.id}
                          className="text-sm border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      {next && (
                        <button
                          onClick={() => updateStatus(order.id, 'advance')}
                          disabled={updatingId === order.id}
                          className="text-sm bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                        >
                          {updatingId === order.id ? 'Updating...' : `Mark as ${next.replace(/_/g, ' ')}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}