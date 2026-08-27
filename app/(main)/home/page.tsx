'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UtensilsCrossed,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  HeartPulse,
  Wrench,
  MoreHorizontal,
} from 'lucide-react'
import { AdCarousel } from '@/components/AdCarousel'

const CATEGORIES = [
  { name: 'Food & Drinks', icon: UtensilsCrossed, color: 'bg-orange-50 text-orange-600' },
  { name: 'Fashion & Clothing', icon: Shirt, color: 'bg-pink-50 text-pink-600' },
  { name: 'Electronics', icon: Smartphone, color: 'bg-blue-50 text-blue-600' },
  { name: 'Home & Living', icon: Sofa, color: 'bg-purple-50 text-purple-600' },
  { name: 'Beauty & Personal Care', icon: Sparkles, color: 'bg-rose-50 text-rose-600' },
  { name: 'Health & Wellness', icon: HeartPulse, color: 'bg-green-50 text-green-600' },
  { name: 'Services', icon: Wrench, color: 'bg-yellow-50 text-yellow-600' },
  { name: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600' },
]

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch() {
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/products')
    }
  }

  return (
    <main className="min-h-screen bg-green-950">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-50 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left: headline */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-gray-100">
              Everything You Need.<br />
              <span className="text-green-700">From Local to Global.</span>
            </h1>
            <p className="text-gray-100 text-lg max-w-md">
              Shop thousands of products across multiple categories at the best prices. Simple. Local. Better.
            </p>
          </div>

          {/* Right: buttons + search */}
          <div>
            <div className="flex flex-wrap gap-3 mb-4">
              <Link
                href="/products"
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-100 font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Shop Now →
              </Link>
              <Link
                href="/businesses"
                className="border border-green-700 text-gray-100 hover:bg-green-50 font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Explore Categories
              </Link>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search products or businesses..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                className="flex-1 px-4 py-3 rounded-lg text-base border border-gray-100"
              />
              <button
                onClick={handleSearch}
                className="bg-green-700 font-semibold px-6 py-3 rounded-lg hover:bg-green-600"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <AdCarousel />

      {/* Feature strip + Trust bar, side by side */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '🛡️', title: 'Secure Shopping', desc: 'Your data is safe with us.' },
              { icon: '↩️', title: 'Easy Returns', desc: 'Hassle-free returns within 7 days.' },
              { icon: '🎧', title: 'Customer Support', desc: "We're here to help anytime." },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{f.title}</p>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:border-l lg:border-gray-200 lg:pl-10">
            {[
              { icon: '🛍️', title: 'Wide Selection', desc: 'A variety of products from trusted vendors.' },
              { icon: '🏷️', title: 'Best Prices', desc: 'Competitive prices and deals every day.' },
              { icon: '⭐', title: 'Trusted Sellers', desc: 'Buy with confidence from verified vendors.' },
              { icon: '🌍', title: 'Local Impact', desc: 'Support local businesses in your community.' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{f.title}</p>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.name}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center text-center gap-2 group"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${cat.color} group-hover:scale-105 transition-transform`}>
                  <Icon size={26} strokeWidth={1.75} />
                </div>
                <p className="text-xs font-medium text-gray-100 leading-tight">{cat.name}</p>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}