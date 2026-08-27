'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Ad {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
}

export function AdCarousel() {
  const [ads, setAds] = useState<Ad[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    fetch('/api/ads')
      .then(r => r.json())
      .then(data => { if (data.success) setAds(data.data) })
  }, [])

  useEffect(() => {
    if (ads.length <= 1) return
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % ads.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [ads.length])

  if (ads.length === 0) return null

  const slide = ads[current]

  return (
    <section className="max-w-6xl mx-auto px-6 pb-16 md:pb-24">
      <div className="relative w-full h-48 md:h-56 rounded-2xl overflow-hidden">
        {slide.linkUrl ? (
          <Link href={slide.linkUrl} className="block w-full h-full">
            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
          </Link>
        ) : (
          <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
        )}

        {ads.length > 1 && (
          <>
            <button
              onClick={() => setCurrent(c => (c - 1 + ads.length) % ads.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrent(c => (c + 1) % ads.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full ${i === current ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}