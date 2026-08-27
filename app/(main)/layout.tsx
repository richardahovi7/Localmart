'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, User, Bell, LayoutDashboard } from 'lucide-react'
import { CartProvider, useCart } from '@/lib/CartContext'
import Footer from '@/components/Footer'

interface Notification {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [isSeller, setIsSeller] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { cartCount, refreshCart } = useCart()

  useEffect(() => {
    const t = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    setToken(t || null)
    setLoggedIn(!!t)

    const stored = localStorage.getItem('user')
    if (stored) {
      const u = JSON.parse(stored)
      setIsSeller(u.role === 'SELLER' || u.role === 'ADMIN')
    }

    if (t) {
      fetch('/api/notifications', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(data => { if (data.success) setNotifications(data.data) })
    }

    refreshCart()
  }, [refreshCart])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
    localStorage.clear()
    setLoggedIn(false)
    router.push('/home')
  }

  async function markAllRead() {
    if (!token) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const navLinks = [
    { href: '/home', label: 'Home' },
    { href: '/products', label: 'Shop' },
    { href: '/businesses', label: 'Categories' },
    { href: '/products?deals=1', label: 'Deals' },
  ]

  const unreadCount = notifications.filter(n => !n.is_read).length
  const recentNotifications = notifications.slice(0, 5)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between gap-6">
          <Link href="/home" className="flex items-center shrink-0">
            <div className="h-24 w-32 overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="LocalMart" className="h-28 w-auto scale-125" />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-green-700">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-green-700 hover:text-green-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5 shrink-0">
            {isSeller && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:underline"
              >
                <LayoutDashboard size={18} />
                Seller Dashboard
              </Link>
            )}

            {loggedIn && (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setShowDropdown(s => !s)} className="relative">
                  <Bell size={22} className="text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm">Notifications</p>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-green-700 hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>

                    {recentNotifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {recentNotifications.map(n => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 last:border-0 ${n.is_read ? '' : 'bg-green-50'}`}
                          >
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <Link
                      href="/notifications"
                      onClick={() => setShowDropdown(false)}
                      className="block text-center text-sm text-green-700 font-medium py-3 border-t border-gray-100 hover:bg-gray-50"
                    >
                      View all
                    </Link>
                  </div>
                )}
              </div>
            )}

            {loggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-green-700"
              >
                <User size={18} />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-green-700"
              >
                <User size={18} />
                Sign In
              </Link>
            )}

            <Link href="/cart" className="relative">
              <ShoppingCart size={22} className="text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <LayoutContent>{children}</LayoutContent>
    </CartProvider>
  )
}