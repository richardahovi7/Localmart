import Link from 'next/link'
import { ShieldCheck, RotateCcw, Headphones, Tag } from 'lucide-react'

export default function Footer() {
  const features = [
    { icon: ShieldCheck, title: 'Secure Shopping', desc: 'Your data and payment information are protected.' },
    { icon: RotateCcw, title: 'Easy Returns', desc: 'Hassle-free returns within 7 days.' },
    { icon: Headphones, title: 'Customer Support', desc: "We're here to help you anytime." },
    { icon: Tag, title: 'Best Prices', desc: 'Get the best deals every day.' },
  ]

  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {features.map(f => (
          <div key={f.title} className="flex items-start gap-3">
            <f.icon size={22} className="text-green-700 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 text-center text-xs text-gray-400 py-6">
        © 2026 Local Mart. All rights reserved.{' '}
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link> |{' '}
        <Link href="/terms" className="hover:underline">Terms of Service</Link> |{' '}
        <Link href="/help" className="hover:underline">Help Center</Link>
      </div>
    </footer>
  )
}