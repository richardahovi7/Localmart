'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Phone, Mail, MapPin, ShieldCheck, Lock, ChevronDown, Truck, Check } from 'lucide-react'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    title: string
    priceInCents: number
    imageUrls: string[]
    business: {
      id: string
      name: string
      offersFreeDelivery: boolean
      deliveryFeeCents: number
    }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [placingOrder, setPlacingOrder] = useState(false)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'cash_on_delivery'>('paystack')
  const [paymentOpen, setPaymentOpen] = useState(true)
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => {
    const t = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    setToken(t || null)

    if (!t) {
      router.push('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(t.split('.')[1]))
      setEmail(payload.email || '')
    } catch (e) {
      console.error('Failed to decode token', e)
    }

    const stored = localStorage.getItem('user')
    if (stored) {
      const u = JSON.parse(stored)
      if (u.full_name) setFullName(u.full_name)
      if (u.phone) setPhone(u.phone)
    }

    fetch('/api/cart', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          if (data.data.length === 0) router.push('/cart')
          setItems(data.data)
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const subtotal = items.reduce((sum, i) => sum + i.product.priceInCents * i.quantity, 0)

  // Delivery fee is per-vendor, not per-item — dedupe by business id
  const vendorDeliveryFees = new Map<string, { name: string; feeCents: number; free: boolean }>()
  for (const item of items) {
    const b = item.product.business
    if (!vendorDeliveryFees.has(b.id)) {
      vendorDeliveryFees.set(b.id, {
        name: b.name,
        feeCents: b.offersFreeDelivery ? 0 : b.deliveryFeeCents,
        free: b.offersFreeDelivery,
      })
    }
  }
  const vendorFeesList = Array.from(vendorDeliveryFees.values())
  const totalDeliveryCents = vendorFeesList.reduce((sum, v) => sum + v.feeCents, 0)
  const allFree = vendorFeesList.every(v => v.free)

  const total = subtotal + totalDeliveryCents

  async function handlePlaceOrder() {
    if (!token) return
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      alert('Please fill in your name, phone, and delivery address')
      return
    }

    try {
      setPlacingOrder(true)

      const deliveryNotes = `Contact: ${fullName} (${phone})`

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deliveryAddress: address, deliveryNotes })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      const orderIds = data.data.orders.map((o: any) => o.id)

      const payRes = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, email, method: paymentMethod })
      })
      const payData = await payRes.json()

      if (paymentMethod === 'cash_on_delivery') {
        window.location.href = '/orders?cod=1'
        return
      }

      if (!payData.authorizationUrl) throw new Error(payData.error || 'Could not start payment')
      window.location.href = payData.authorizationUrl

    } catch (err: any) {
      alert('Checkout failed: ' + err.message)
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 h-24 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 min-h-screen">
      {/* Progress bar */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="bg-white border border-gray-100 rounded-xl px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center">
              <Check size={16} />
            </div>
            <span className="text-sm font-medium text-gray-900">Cart</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 min-w-[24px]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm font-semibold text-gray-900">Checkout</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 min-w-[24px]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm text-gray-400">Review</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 min-w-[24px]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
            <span className="text-sm text-gray-400">Order Complete</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Checkout</h1>
        <p className="text-gray-500 text-sm mb-6">Almost there! Please fill in your details to complete your order.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Delivery Information */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold">1</div>
                  <h2 className="font-bold text-gray-900">Delivery Information</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+233 (0) 123 456 789"
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Street, city, region"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Delivery</p>
                  {vendorFeesList.length <= 1 ? (
                    <div className="border-2 border-green-700 bg-green-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-green-700 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-green-700" />
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-green-700">
                          <Truck size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Standard Delivery</p>
                          <p className="text-xs text-gray-500">
                            {vendorFeesList[0]?.name || 'Delivery'}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold text-sm ${allFree ? 'text-green-700' : 'text-gray-900'}`}>
                        {allFree ? 'FREE' : `GH₵ ${(totalDeliveryCents / 100).toFixed(2)}`}
                      </span>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {vendorFeesList.map(v => (
                        <div key={v.name} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-700">
                              <Truck size={16} />
                            </div>
                            <p className="text-sm font-medium text-gray-900">{v.name}</p>
                          </div>
                          <span className={`font-semibold text-sm ${v.free ? 'text-green-700' : 'text-gray-900'}`}>
                            {v.free ? 'FREE' : `GH₵ ${(v.feeCents / 100).toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <button
                onClick={() => setPaymentOpen(o => !o)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold">2</div>
                  <h2 className="font-bold text-gray-900">Payment Method</h2>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${paymentOpen ? 'rotate-180' : ''}`} />
              </button>

              {paymentOpen && (
                <div className="mt-5 space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={paymentMethod === 'paystack'}
                      onChange={() => setPaymentMethod('paystack')}
                    />
                    Pay Now with MoMo
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                    />
                    Pay on Delivery
                  </label>
                </div>
              )}
            </div>

            {/* Review Order */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <button
                onClick={() => setReviewOpen(o => !o)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">3</div>
                  <h2 className="font-bold text-gray-900">Review Order</h2>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${reviewOpen ? 'rotate-180' : ''}`} />
              </button>

              {reviewOpen && (
                <div className="mt-5 space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <img
                        src={item.product.imageUrls[0] || 'https://placehold.co/48x48?text=?'}
                        alt={item.product.title}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{item.product.title}</p>
                        <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        GH₵ {(item.product.priceInCents * item.quantity / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Order Summary</h2>
                <Link href="/cart" className="text-sm text-green-700 hover:underline">Edit Cart</Link>
              </div>

              <div className="space-y-4 mb-5">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product.imageUrls[0] || 'https://placehold.co/56x56?text=?'}
                      alt={item.product.title}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.title}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      GH₵ {(item.product.priceInCents * item.quantity / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                  <span className="font-medium text-gray-900">GH₵ {(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className={`font-medium ${allFree ? 'text-green-700' : 'text-gray-900'}`}>
                    {allFree ? 'FREE' : `GH₵ ${(totalDeliveryCents / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center mb-4">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-green-700 text-lg">GH₵ {(total / 100).toFixed(2)}</span>
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-500 mb-4">
                <ShieldCheck size={16} className="text-green-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700">Secure Checkout</p>
                  <p>Your payment information is safe with us.</p>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {placingOrder ? 'Placing order...' : 'Place Order'}
                {!placingOrder && <Lock size={16} />}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                By placing your order, you agree to our{' '}
                <Link href="/terms" className="text-green-700 hover:underline">Terms of Service</Link> and{' '}
                <Link href="/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}