'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendMessage, setResendMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }

      const token = data.data.token
      const user = data.data.user

      document.cookie = `token=${token}; path=/; max-age=604800`
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)

      if (user.role === 'SELLER') {
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

  async function handleResend() {
    setResending(true)
    setResendMessage('')
    setError('')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      setResendMessage('A new code has been sent to your email.')
    } catch {
      setError('Something went wrong')
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return (
      <div className="text-center py-4">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Missing Email</h1>
        <p className="text-gray-500 text-sm mb-6">We couldn't find an email to verify. Please sign up again.</p>
        <Link href="/signup" className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium">
          Back to Sign Up
        </Link>
      </div>
    )
  }

  return (
    <>
      <p className="text-4xl mb-4 text-center">📧</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Verify Your Email</h1>
      <p className="text-gray-500 text-sm mb-6 text-center">
        We sent a 6-digit code to <strong>{email}</strong>
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}
      {resendMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{resendMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Verification Code</label>
          <input
            required
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={resending}
        className="w-full text-center text-sm text-green-700 hover:underline mt-4 disabled:opacity-60"
      >
        {resending ? 'Sending...' : "Didn't get a code? Resend"}
      </button>
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8">
        <Suspense fallback={<p className="text-center text-gray-500">Loading...</p>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}