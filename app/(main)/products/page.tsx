'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Headphones, Shirt, Sofa, Sparkles, Dumbbell, Gamepad2, Car, BookOpen, MoreHorizontal,
  Grid3x3, List, ChevronLeft, ChevronRight, Star, Heart
} from 'lucide-react'
import { useCart } from '@/lib/CartContext'

interface Product {
  id: string
  title: string
  slug: string
  priceInCents: number
  comparePrice?: number
  imageUrls: string[]
  ratingAvg: number
  ratingCount: number
  brand?: string
  isFeatured: boolean
  createdAt: string
  businessName: string
  category?: { name: string }
}

interface CountRow {
  name?: string
  brand?: string
  count: number
}

const CATEGORY_ICONS: Record<string, any> = {
  'Electronics': Headphones,
  'Fashion & Clothing': Shirt,
  'Home & Living': Sofa,
  'Beauty & Personal Care': Sparkles,
  'Health & Wellness': Dumbbell,
  'Services': Gamepad2,
  'Automotive': Car,
  'Books & Media': BookOpen,
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  )
}

function isNew(createdAt: string) {
  const daysSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince <= 14
}

function ProductCard({ product, view }: { product: Product; view: 'grid' | 'list' }) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const { refreshCart } = useCart()

  const price = (product.priceInCents / 100).toFixed(2)
  const comparePrice = product.comparePrice ? (product.comparePrice / 100).toFixed(2) : null
  const discount = comparePrice ? Math.round((1 - product.priceInCents / product.comparePrice!) * 100) : null
  const image = product.imageUrls[0] || 'https://placehold.co/300x300?text=No+Image'

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      setAdding(true)
      const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
      if (!token) {
        window.location.href = '/login'
        return
      }
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setAdded(true)
      refreshCart()
      setTimeout(() => setAdded(false), 1500)
    } catch (err) {
      alert('Could not add to cart')
    } finally {
      setAdding(false)
    }
  }

  if (view === 'list') {
    return (
      <Link href={`/products/${product.id}`} className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex gap-4 p-4">
        <div className="w-32 h-32 shrink-0 bg-green-800 rounded-lg overflow-hidden relative">
          <img src={image} alt={product.title} className="w-full h-full object-cover" />
          {discount && (
            <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">-{discount}%</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-1">{product.category?.name || product.businessName}</p>
          <h3 className="font-medium text-gray-900 mb-1">{product.title}</h3>
          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={product.ratingAvg} />
            <span className="text-xs text-gray-400">({product.ratingCount})</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-green-700">GH₵ {price}</span>
            {comparePrice && <span className="text-xs text-gray-400 line-through">GH₵ {comparePrice}</span>}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-60"
          >
            {added ? 'Added ✓' : adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden relative group">
      {discount && (
        <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">-{discount}%</span>
      )}
      {!discount && isNew(product.createdAt) && (
        <span className="absolute top-2 left-2 z-10 bg-yellow-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">New</span>
      )}
      <button className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white">
        <Heart size={14} className="text-gray-400" />
      </button>

      <Link href={`/products/${product.id}`}>
        <div className="aspect-square bg-gray-100 overflow-hidden">
          <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-500 mb-1">{product.category?.name || product.businessName}</p>
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">{product.title}</h3>
          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={product.ratingAvg} />
            <span className="text-xs text-gray-400">({product.ratingCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-green-700">GH₵ {price}</span>
            {comparePrice && <span className="text-xs text-gray-400 line-through">GH₵ {comparePrice}</span>}
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="w-full bg-green-700 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-600 disabled:opacity-60"
        >
          {added ? 'Added ✓' : adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

function ProductsPageContent() {
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [categoryCounts, setCategoryCounts] = useState<CountRow[]>([])
  const [brandCounts, setBrandCounts] = useState<CountRow[]>([])
  const [availabilityCounts, setAvailabilityCounts] = useState({ inStockCount: 0, outOfStockCount: 0 })

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [inStock, setInStock] = useState(true)
  const [outOfStock, setOutOfStock] = useState(false)
  const [sort, setSort] = useState('featured')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const limit = 12

  const fetchProducts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort })
    if (search) params.set('search', search)
    if (category !== 'All') params.set('category', category)
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','))
    if (priceMin) params.set('priceMin', priceMin)
    if (priceMax) params.set('priceMax', priceMax)
    params.set('inStock', String(inStock))
    params.set('outOfStock', String(outOfStock))

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProducts(data.data.products)
          setTotal(data.data.total)
          setPages(data.data.pages)
          setCategoryCounts(data.data.categoryCounts || [])
          setBrandCounts(data.data.brandCounts || [])
          setAvailabilityCounts(data.data.availabilityCounts || { inStockCount: 0, outOfStockCount: 0 })
        }
      })
      .finally(() => setLoading(false))
  }, [search, category, selectedBrands, priceMin, priceMax, inStock, outOfStock, sort, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function toggleBrand(brand: string) {
    setPage(1)
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])
  }

  function clearAllFilters() {
    setSearch('')
    setCategory('All')
    setSelectedBrands([])
    setPriceMin('')
    setPriceMax('')
    setInStock(true)
    setOutOfStock(false)
    setPage(1)
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  function getPageNumbers(): (number | '...')[] {
    const result: (number | '...')[] = []
    const add = (n: number | '...') => {
      if (result[result.length - 1] !== n) result.push(n)
    }
    add(1)
    if (page > 3) add('...')
    for (let p = Math.max(2, page - 1); p <= Math.min(pages - 1, page + 1); p++) add(p)
    if (page < pages - 2) add('...')
    if (pages > 1) add(pages)
    return result
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-xs text-gray-500 mb-3">
          <Link href="/home" className="hover:underline">Home</Link> <span className="mx-1">/</span> Shop
        </p>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">All Products</h1>
        <p className="text-gray-500 text-sm mb-6">Discover top deals and great products from trusted sellers.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setCategory('All'); setPage(1) }}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${category === 'All' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  All Categories
                </button>
                {categoryCounts.map(c => (
                  <button
                    key={c.name}
                    onClick={() => { setCategory(c.name!); setPage(1) }}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-lg flex justify-between items-center ${category === c.name ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-gray-400">{c.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900"
                />
              </div>
              <button
                onClick={() => { setPage(1); fetchProducts() }}
                className="mt-2 text-xs font-medium text-green-700 hover:underline"
              >
                Apply
              </button>
            </div>

            {brandCounts.length > 0 && (
              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Brand</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {brandCounts.map(b => (
                    <label key={b.brand} className="flex items-center justify-between text-sm cursor-pointer">
                      <span className="flex items-center gap-2 text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(b.brand!)}
                          onChange={() => toggleBrand(b.brand!)}
                          className="accent-green-700"
                        />
                        {b.brand}
                      </span>
                      <span className="text-xs text-gray-400">({b.count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Customer Rating</h3>
              <div className="space-y-2">
                {[4, 3, 2, 1].map(r => (
                  <div key={r} className="flex items-center gap-2 text-sm text-gray-500">
                    <StarRating rating={r} />
                    <span>& up</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Availability</h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm cursor-pointer">
                  <span className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={e => { setInStock(e.target.checked); setPage(1) }}
                      className="accent-green-700"
                    />
                    In Stock
                  </span>
                  <span className="text-xs text-gray-400">({availabilityCounts.inStockCount})</span>
                </label>
                <label className="flex items-center justify-between text-sm cursor-pointer">
                  <span className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={outOfStock}
                      onChange={e => { setOutOfStock(e.target.checked); setPage(1) }}
                      className="accent-green-700"
                    />
                    Out of Stock
                  </span>
                  <span className="text-xs text-gray-400">({availabilityCounts.outOfStockCount})</span>
                </label>
              </div>
            </div>

            <button
              onClick={clearAllFilters}
              className="w-full border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
            >
              Clear All Filters
            </button>
          </aside>

          <div>
            <div className="flex gap-4 overflow-x-auto pb-4 mb-4 border-b border-gray-100">
              {categoryCounts.slice(0, 9).map(c => {
                const Icon = CATEGORY_ICONS[c.name!] || MoreHorizontal
                return (
                  <button
                    key={c.name}
                    onClick={() => { setCategory(c.name!); setPage(1) }}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${category === c.name ? 'bg-green-700 text-white' : 'bg-gray-50 text-gray-600'}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[11px] text-gray-600 whitespace-nowrap">{c.name}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              />

              <div className="flex items-center gap-3 ml-auto">
                <p className="text-sm text-gray-500 hidden sm:block">
                  {total === 0 ? 'No products' : `Showing ${rangeStart}–${rangeEnd} of ${total} products`}
                </p>
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value); setPage(1) }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 ${view === 'grid' ? 'bg-green-700 text-white' : 'bg-white text-gray-500'}`}
                  >
                    <Grid3x3 size={16} />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 ${view === 'list' ? 'bg-green-700 text-white' : 'bg-white text-gray-500'}`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={view === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-4'}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={view === 'grid' ? 'bg-gray-100 rounded-xl aspect-square animate-pulse' : 'bg-gray-100 rounded-xl h-32 animate-pulse'} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-4xl mb-3">🛍️</p>
                <p className="font-medium">No products found</p>
                <p className="text-sm">Try a different search or filter combination</p>
              </div>
            ) : (
              <>
                <div className={view === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-4'}>
                  {products.map(p => <ProductCard key={p.id} product={p} view={view} />)}
                </div>

                {pages > 1 && (
                  <div className="flex justify-center items-center gap-1.5 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {getPageNumbers().map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium ${p === page ? 'bg-green-700 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-6">Loading...</div>}>
      <ProductsPageContent />
    </Suspense>
  )
}