'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  orders: number
  products: number
  revenue: number
  rating: number
}

interface PayoutHistoryItem {
  id: string
  amount_cents: number
  status: string
  payout_method: string | null
  payout_reference: string | null
  paid_at: string | null
  created_at: string
}

interface PayoutData {
  totalOwedCents: number
  owedOrderIds: string[]
  payoutHistory: PayoutHistoryItem[]
}

export default function SellerDashboard() {
  const [stats] = useState<Stats>({ orders: 0, products: 0, revenue: 0, rating: 0 })
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null)
  const [payoutLoading, setPayoutLoading] = useState(true)

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (token) {
      fetch('/api/seller/payouts', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (data.success) setPayoutData(data.data) })
        .catch(err => console.error('Payouts fetch error:', err))
        .finally(() => setPayoutLoading(false))
    } else {
      setPayoutLoading(false)
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-7 py-8">
      <h1 className="text-2xl font-bold text-green-800 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: stats.orders, color: 'bg-blue-50 text-blue-700', icon: '📦' },
          { label: 'Products Listed', value: stats.products, color: 'bg-green-50 text-green-700', icon: '🛍️' },
          { label: 'Revenue (GHS)', value: stats.revenue.toFixed(2), color: 'bg-yellow-50 text-yellow-700', icon: '💰' },
          { label: 'Avg Rating', value: stats.rating || '—', color: 'bg-purple-50 text-purple-700', icon: '⭐' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm opacity-70 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/seller-products/new"
          className="bg-green-700 text-white rounded-xl p-6 hover:bg-green-600 transition-colors">
          <p className="text-2xl mb-2">➕</p>
          <p className="font-bold text-lg">Add New Product</p>
          <p className="text-green-200 text-sm mt-1">List a product or service</p>
        </Link>
        <Link href="/seller-products"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow transition-shadow">
          <p className="text-2xl mb-2">📋</p>
          <p className="font-bold text-lg text-gray-800">My Products</p>
          <p className="text-gray-500 text-sm mt-1">Manage your listings</p>
        </Link>
        <Link href="/seller-orders"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow transition-shadow">
          <p className="text-2xl mb-2">🚀</p>
          <p className="font-bold text-lg text-gray-800">Orders</p>
          <p className="text-gray-500 text-sm mt-1">View and manage orders</p>
        </Link>
      </div>

      {/* Payouts */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="font-bold text-lg text-green-800 mb-4">Payouts</h2>

        {payoutLoading ? (
          <div className="animate-pulse h-16 bg-gray-100 rounded-lg" />
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-green-700">You're currently owed</p>
                <p className="text-3xl font-bold text-green-800">
                  GH₵ {((payoutData?.totalOwedCents || 0) / 100).toFixed(2)}
                </p>
                {payoutData && payoutData.owedOrderIds.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Across {payoutData.owedOrderIds.length} completed order{payoutData.owedOrderIds.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <p className="text-4xl">💵</p>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-2">Payout History</h3>
            {!payoutData || payoutData.payoutHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No payouts recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {payoutData.payoutHistory.map(p => (
                  <div key={p.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">GH₵ {(p.amount_cents / 100).toFixed(2)}</p>
                      <p className="text-gray-500 text-xs">
                        {p.payout_method || 'Manual'} {p.payout_reference ? `· Ref: ${p.payout_reference}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status}
                      </span>
                      <p className="text-gray-400 text-xs mt-1">
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Business profile tip */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-start gap-4">
        <p className="text-2xl">💡</p>
        <div>
          <p className="font-semibold text-yellow-800">Complete your business profile</p>
          <p className="text-yellow-700 text-sm mt-1">Add your business logo, description, and location to attract more customers.</p>
          <Link href="/seller/profile" className="inline-block mt-2 text-sm font-medium text-yellow-800 underline">Update Profile →</Link>
        </div>
      </div>
    </div>
  )
}