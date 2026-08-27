'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string
  priceInCents: number
  comparePrice?: number
  inventoryCount: number
  imageUrls: string[]
  sku?: string
  tags: string[]
  businessId: string
  businessName: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setProduct(data.data) })
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleAddToCart() {
    if (!product) return
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
      setTimeout(() => setAdded(false), 1500)
    } catch (err) {
      alert('Could not add to cart')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-100 aspect-square rounded-xl" />
          <div className="space-y-4">
            <div className="bg-gray-100 h-8 w-3/4 rounded" />
            <div className="bg-gray-100 h-6 w-1/2 rounded" />
            <div className="bg-gray-100 h-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
        <Link href="/products" className="inline-block bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-600 mt-4">
          Browse Products
        </Link>
      </div>
    </div>
  )

  const price = (product.priceInCents / 100).toFixed(2)
  const comparePrice = product.comparePrice ? (product.comparePrice / 100).toFixed(2) : null
  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : ['/placeholder.png']

  return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">← Back to Products</Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-white rounded-xl overflow-hidden mb-3 border border-gray-100">
              <img src={images[selectedImage]} alt={product.title} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 bg-white ${i === selectedImage ? 'border-green-600' : 'border-transparent'}`}>
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">{product.businessName}</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 capitalize">{product.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-green-700">GH₵ {price}</span>
              {comparePrice && <span className="text-lg text-gray-400 line-through">GH₵ {comparePrice}</span>}
            </div>
            <p className="text-gray-600 mb-6 whitespace-pre-wrap">{product.description}</p>
            <p className="text-sm text-gray-500 mb-6">
              {product.inventoryCount > 0 ? `${product.inventoryCount} in stock` : 'Out of stock'}
            </p>
            <button
              onClick={handleAddToCart}
              disabled={adding || product.inventoryCount === 0}
              className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-60 mb-3"
            >
              {added ? 'Added to Cart ✓' : adding ? 'Adding...' : product.inventoryCount === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            {product.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}