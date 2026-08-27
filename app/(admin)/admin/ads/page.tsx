'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, GripVertical } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface Ad {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
  isActive: boolean
  sortOrder: number
}

export default function AdminAdsPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    const t = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    if (!t) { router.push('/login'); return }
    setToken(t)
    fetchAds(t)
  }, [router])

  function fetchAds(t: string) {
    setLoading(true)
    fetch('/api/admin/ads', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setAds(data.data) })
      .finally(() => setLoading(false))
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !imageFile) {
      alert('Title and image are required')
      return
    }

    try {
      setUploading(true)
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `ad-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile)
      if (uploadError) throw new Error('Image upload failed: ' + uploadError.message)

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)

      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          imageUrl: urlData.publicUrl,
          linkUrl: linkUrl || null,
          sortOrder: ads.length,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setTitle('')
      setLinkUrl('')
      setImageFile(null)
      setPreviewUrl('')
      fetchAds(token)
    } catch (err: any) {
      alert('Failed to create ad: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function toggleActive(ad: Ad) {
    const res = await fetch(`/api/admin/ads/${ad.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !ad.isActive }),
    })
    const data = await res.json()
    if (data.success) {
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, isActive: !a.isActive } : a))
    }
  }

  async function deleteAd(id: string) {
    if (!confirm('Delete this ad?')) return
    const res = await fetch(`/api/admin/ads/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) {
      setAds(prev => prev.filter(a => a.id !== id))
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Manage Homepage Ads</h1>

      <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-6 mb-8 space-y-4">
        <h2 className="font-bold text-gray-900">Add New Slide</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Weekend Flash Sale"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
          <input
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="/products?category=Electronics"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
          />
          {previewUrl && (
            <img src={previewUrl} className="mt-2 w-full h-40 object-cover rounded-lg border" />
          )}
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
        >
          <Plus size={16} />
          {uploading ? 'Uploading...' : 'Add Slide'}
        </button>
      </form>

      <h2 className="font-bold text-gray-900 mb-3">Current Slides ({ads.length})</h2>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="bg-gray-100 h-20 rounded-xl" />)}
        </div>
      ) : ads.length === 0 ? (
        <p className="text-gray-500 text-sm">No slides yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <div key={ad.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <GripVertical size={18} className="text-gray-300 shrink-0" />
              <img src={ad.imageUrl} alt={ad.title} className="w-20 h-14 object-cover rounded-lg bg-gray-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{ad.title}</p>
                <p className="text-xs text-gray-400 truncate">{ad.linkUrl || 'No link'}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 shrink-0">
                <input
                  type="checkbox"
                  checked={ad.isActive}
                  onChange={() => toggleActive(ad)}
                  className="accent-green-700"
                />
                Active
              </label>
              <button
                onClick={() => deleteAd(ad.id)}
                className="text-gray-400 hover:text-red-500 p-2 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}