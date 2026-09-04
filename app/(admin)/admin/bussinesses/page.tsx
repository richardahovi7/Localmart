'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Star, ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminBusiness {
  id: string
  name: string
  city: string | null
  status: string
  ratingAvg: number
  ratingCount: number
  productCount: number
  ownerName: string
  ownerEmail: string
  createdAt: string
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchBusinesses = useCallback(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    fetch(`/api/admin/businesses?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBusinesses(data.data.businesses)
          setPages(data.data.pages)
          setTotal(data.data.total)
        }
      })
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { fetchBusinesses() }, [fetchBusinesses])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Businesses</h1>
      <p className="text-gray-500 text-sm mb-6">{total} total businesses</p>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search businesses..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full sm:w-96 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-100 h-12 rounded-lg animate-pulse" />)}
          </div>
        ) : businesses.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">No businesses found.</p>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Business</span>
              <span>Owner</span>
              <span>Rating</span>
              <span>Products</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-gray-50">
              {businesses.map(b => (
                <div key={b.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.city || 'No city set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{b.ownerName}</p>
                    <p className="text-xs text-gray-400">{b.ownerEmail}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-gray-700">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    {b.ratingAvg.toFixed(1)} ({b.ratingCount})
                  </span>
                  <p className="text-sm text-gray-700">{b.productCount}</p>
                  <span className="text-xs font-medium px-2 py-1 rounded-full w-fit bg-green-50 text-green-700">
                    {b.status || 'Active'}
                  </span>
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