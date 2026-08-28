'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking')

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      return
    }
    fetch(`/api/checkout/verify?reference=${reference}`)
      .then(r => r.json())
      .then(data => setStatus(data.success ? 'success' : 'failed'))
      .catch(() => setStatus('failed'))
  }, [reference])

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      {status === 'checking' && (
        <>
          <p className="text-4xl mb-4">⏳</p>
          <h1 className="text-2xl font-bold mb-2">Confirming your payment...</h1>
          <p className="text-gray-700">Please wait a moment</p>
        </>
      )}
      {status === 'success' && (
        <>
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-2xl font-bold mb-2">Payment confirmed!</h1>
          <p className="text-gray-700 mb-6">Your order has been placed successfully.</p>
          <Link href="/orders" className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg">
            View your orders
          </Link>
        </>
      )}
      {status === 'failed' && (
        <>
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-2xl font-bold mb-2">We couldn't confirm this payment</h1>
          <p className="text-gray-500 mb-6">If money was deducted, contact support with your reference.</p>
          <Link href="/orders" className="inline-block border border-gray-300 px-6 py-3 rounded-lg">
            Check your orders
          </Link>
        </>
      )}
    </div>
  )
}