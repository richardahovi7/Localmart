'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Lock, Eye, EyeOff, ShoppingCart } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!data.success) {
        if (typeof data.error === 'string' && data.error.startsWith('UNVERIFIED:')) {
          const unverifiedEmail = data.error.split('UNVERIFIED:')[1]
          router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)
          return
        }
        setError(data.error)
        return
      }

      const token = data.data.token
      const user = data.data.user

      document.cookie = `token=${token}; path=/; max-age=${rememberMe ? 604800 : 86400}`
      localStorage.setItem('user', JSON.stringify(user))

      if (user.role === 'ADMIN') {
        router.push('/admin')
      } else if (user.role === 'SELLER') {
        router.push('/dashboard')
      } else {
        router.push('/home')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full bg-gray-50 rounded-3xl p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div>
              <img src="/logo.png" alt="LocalMart" className="h-60 w-65 mb-8" />
              <h1 className="text-3xl font-bold text-green-900 mb-1">Welcome Back!</h1>
              <p className="text-xl text-green-700 mb-4">Good to see you again.</p>
              <p className="text-green-700 mb-10 max-w-xs">
                Sign in to continue shopping the best products at the best prices.
              </p>
              <div className="hidden md:flex w-full aspect-[4/3] max-w-sm bg-white rounded-2xl border border-gray-100 items-center justify-center">
                <ShoppingCart size={64} strokeWidth={1.25} className="text-green-700" />
              </div>
            </div>

            {/* Right — form card */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Login to <span className="text-green-700">Local Mart</span>
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Access your account to manage orders, track deliveries and more.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="Enter your email or phone number"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Enter your password"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="text-right mt-1.5">
                    <Link href="/forgot-password" className="text-sm text-green-700 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-green-700"
                  />
                  Remember me
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-800 hover:bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? 'Logging in...' : 'Login'} {!loading && '→'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <Link href="/signup" className="text-green-700 font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature strip + footer */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { title: 'Secure Shopping', desc: 'Your data is safe with us.' },
            { title: 'Easy Returns', desc: 'Hassle-free returns within 7 days.' },
            { title: 'Customer Support', desc: "We're here to help you anytime." },
            { title: 'Best Prices', desc: 'Get the best deals every day.' },
          ].map(f => (
            <div key={f.title} className="text-center">
              <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
              <p className="text-xs text-gray-600 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-gray-400 pb-6">
          © 2026 Local Mart. All rights reserved.{' '}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link> |{' '}
          <Link href="/terms" className="hover:underline">Terms of Service</Link> |{' '}
          <Link href="/help" className="hover:underline">Help Center</Link>
        </div>
      </div>
    </div>
  )
}