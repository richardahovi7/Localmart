'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, Store, ShieldCheck, TrendingUp, Headphones } from 'lucide-react'

interface Business {
  id: string
  name: string
  slug: string
  logoUrl?: string
  bannerUrl?: string
  city?: string
  region?: string
  ratingAvg: number
  ratingCount: number
  isFeatured: boolean
  category?: { name: string; slug: string }
  _count: { products: number }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

function BusinessCard({ business }: { business: Business }) {
  return (
    <Link href={`/businesses/${business.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group">
      <div className="h-28 bg-gradient-to-r from-green-600 to-green-400 relative overflow-hidden">
        {business.bannerUrl && <img src={business.bannerUrl} alt="" className="w-full h-full object-cover" />}
        {business.isFeatured && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">Featured</span>
        )}
        <div className="absolute -bottom-6 left-4">
          <div className="w-12 h-12 rounded-full bg-white border-2 border-white shadow flex items-center justify-center overflow-hidden">
            {business.logoUrl
              ? <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
              : <span className="text-green-700 font-bold text-lg">{business.name[0]}</span>
            }
          </div>
        </div>
      </div>
      <div className="pt-8 p-4">
        <h3 className="font-semibold text-gray-700">{business.name}</h3>
        <p className="text-xs text-gray-700 mb-2">{business.category?.name} {business.city && `· ${business.city}`}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <StarRating rating={business.ratingAvg} />
            <span className="text-xs text-gray-700">({business.ratingCount})</span>
          </div>
          <span className="text-xs text-gray-500">{business._count.products} products</span>
        </div>
      </div>
    </Link>
  )
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '12' })
    if (search) params.set('search', search)
    if (city) params.set('city', city)
    fetch(`/api/businesses?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) { setBusinesses(data.data.businesses); setTotal(data.data.total) }
      })
      .finally(() => setLoading(false))
  }, [search, city])

  const CITIES = ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast']

  return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Local Businesses</h1>
        <p className="text-gray-500 text-sm mb-6">Discover and support amazing local businesses near you.</p>

        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 bg-white rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700" />
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="border border-gray-200 bg-white rounded-full pl-10 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 appearance-none"
            >
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-16 text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
              <Store size={56} className="text-green-700" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">No businesses found</h2>
            <p className="text-gray-500 text-sm mb-6">Be the first to register your business!</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg"
            >
              <Store size={18} />
              Register Your Business
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{total} businesses found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {businesses.map(b => <BusinessCard key={b.id} business={b} />)}
            </div>
          </>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, title: 'Trusted & Verified', desc: 'All businesses are verified for your safety.' },
            { icon: MapPin, title: 'Support Local', desc: 'Help grow your community by shopping local.' },
            { icon: TrendingUp, title: 'Grow Your Business', desc: 'Reach more customers and grow your brand.' },
            { icon: Headphones, title: "We're Here to Help", desc: 'Our support team is always ready to assist you.' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3">
              <f.icon size={22} className="text-green-700 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}