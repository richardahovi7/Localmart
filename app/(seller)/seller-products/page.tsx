'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SellerProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/seller/products', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load products')
      setProducts(data.data || [])
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading products...</div>
  if (errorMsg) return <div className="p-8 text-red-600">{errorMsg}</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link
          href="/seller-products/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
        >
          + Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">No products yet. Add your first one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
              {product.image_urls && product.image_urls.length > 0 && (
                <img
                  src={product.image_urls[0]}
                  alt={product.title}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
              )}
              <h2 className="font-semibold text-lg">{product.title}</h2>
              <p className="text-sm text-gray-500 mb-2">{product.description}</p>
              <p className="font-bold text-green-700">
                GH₵ {(product.price_in_cents / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">
                Stock: {product.inventory_count}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}