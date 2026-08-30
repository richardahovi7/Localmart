'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      setSubmitted(true)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} />
          Back to login
        </Link>

        {submitted ? (
          <div className="text-center py-4">
            <p className="text-4xl mb-4">📧</p>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm">
              If an account exists for <strong>{email}</strong>, we've sent a link to reset your password. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h1>
            <p className="text-gray-500 text-sm mb-6">
              Enter your email and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}