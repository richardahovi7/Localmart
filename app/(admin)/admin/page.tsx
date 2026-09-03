'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Package, Store, DollarSign, ShoppingBag } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalCustomers: number
  totalSellers: number
  totalOrders: number
  totalRevenueCents: number
  totalBusinesses: number
  totalProducts: number
  recentOrders: {
    id: string
    status: string
    grandTotalCents: number
    createdAt: string
    customerName: string
    businessName: string
  }[]
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (!token) return
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 h-24 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-gray-500">Failed to load stats.</p>
      </div>
    )
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.totalCustomers} customers · ${stats.totalSellers} sellers`, icon: Users, color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Orders', value: stats.totalOrders, sub: 'All time', icon: Package, color: 'bg-purple-50 text-purple-700' },
    { label: 'Total Revenue', value: `GH₵ ${(stats.totalRevenueCents / 100).toFixed(2)}`, sub: 'All time', icon: DollarSign, color: 'bg-green-50 text-green-700' },
    { label: 'Businesses', value: stats.totalBusinesses, sub: `${stats.totalProducts} active products`, icon: Store, color: 'bg-yellow-50 text-yellow-700' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Overview</h1>
      <p className="text-gray-500 text-sm mb-6">Site-wide activity at a glance.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-green-700 hover:underline">View all</Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">No orders yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.recentOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={18} className="text-gray-300" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{o.customerName}</p>
                    <p className="text-xs text-gray-400">{o.businessName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                    GH₵ {(o.grandTotalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}