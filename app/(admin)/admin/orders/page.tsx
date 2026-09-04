'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminOrder {
  id: string
  status: string
  grandTotalCents: number
  createdAt: string
  customerName: string
  customerEmail: string
  businessName: string
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchOrders = useCallback(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    fetch(`/api/admin/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setOrders(data.data.orders)
          setPages(data.data.pages)
          setTotal(data.data.total)
        }
      })
      .finally(() => setLoading(false))
  }, [search, status, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Orders</h1>
      <p className="text-gray-500 text-sm mb-6">{total} total orders</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer or business..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-100 h-12 rounded-lg animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">No orders found.</p>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Customer</span>
              <span>Business</span>
              <span>Status</span>
              <span>Date</span>
              <span className="text-right">Total</span>
            </div>
            <div className="divide-y divide-gray-50">
              {orders.map(o => (
                <div key={o.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{o.customerName}</p>
                    <p className="text-xs text-gray-400">{o.customerEmail}</p>
                  </div>
                  <p className="text-sm text-gray-700">{o.businessName}</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status}
                  </span>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm font-semibold text-gray-900 sm:text-right">
                    GH₵ {(o.grandTotalCents / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-gray-300 rounded-lg disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2 border border-gray-300 rounded-lg disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}