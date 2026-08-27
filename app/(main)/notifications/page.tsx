'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: any
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    setToken(t || null)
    if (!t) { router.push('/login'); return }

    fetch('/api/notifications', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setNotifications(data.data) })
      .finally(() => setLoading(false))
  }, [router])

  async function markAsRead(id: string) {
    if (!token) return
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async function markAllRead() {
    if (!token) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="animate-pulse space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 h-20 rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:underline"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
            <Bell size={32} className="mx-auto mb-3 text-gray-300" />
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`w-full text-left border rounded-xl p-4 transition-colors ${
                  n.is_read ? 'bg-white border-gray-100' : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-green-600 shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">{timeAgo(n.created_at)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}