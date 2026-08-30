'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff } from 'lucide-react'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('This reset link is invalid or missing a token.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
        <p className="text-gray-500 text-sm mb-6">This link is missing or malformed. Please request a new one.</p>
        <Link href="/forgot-password" className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium">
          Request New Link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <p className="text-4xl mb-4">✅</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h1>
        <p className="text-gray-500 text-sm">Redirecting you to login...</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h1>
      <p className="text-gray-500 text-sm mb-6">Choose a new password for your account.</p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-700"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-700"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8">
        <Suspense fallback={<p className="text-center text-gray-500">Loading...</p>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  )
}