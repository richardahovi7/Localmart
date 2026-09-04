'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  isActive: boolean
  isVerified: boolean
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: 'bg-blue-50 text-blue-700',
  SELLER: 'bg-purple-50 text-purple-700',
  ADMIN: 'bg-yellow-50 text-yellow-700',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchUsers = useCallback(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setUsers(data.data.users)
          setPages(data.data.pages)
          setTotal(data.data.total)
        }
      })
      .finally(() => setLoading(false))
  }, [search, role, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function toggleActive(u: AdminUser) {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: u.id, isActive: !u.isActive }),
    })
    const data = await res.json()
    if (data.success) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: !x.isActive } : x))
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Users</h1>
      <p className="text-gray-500 text-sm mb-6">{total} total users</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>
        <select
          value={role}
          onChange={e => { setRole(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="SELLER">Seller</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-100 h-12 rounded-lg animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">No users found.</p>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>User</span>
              <span>Role</span>
              <span>Verified</span>
              <span>Status</span>
              <span></span>
            </div>
            <div className="divide-y divide-gray-50">
              {users.map(u => (
                <div key={u.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    {u.isVerified ? (
                      <><CheckCircle2 size={14} className="text-green-600" /> <span className="text-green-700">Verified</span></>
                    ) : (
                      <><XCircle size={14} className="text-gray-400" /> <span className="text-gray-400">Unverified</span></>
                    )}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </span>
                  <button
                    onClick={() => toggleActive(u)}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 w-fit justify-self-end"
                  >
                    {u.isActive ? 'Suspend' : 'Reactivate'}
                  </button>
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