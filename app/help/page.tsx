'use client'

import { useState } from 'react'
import { ChevronDown, Mail, Phone } from 'lucide-react'

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Once your order is placed, you can view its status on the Orders page. Sellers update order status as it moves from processing to delivery.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'LocalMart accepts mobile money and card payments through Paystack, as well as Cash on Delivery for eligible orders.',
  },
  {
    q: 'How does delivery work?',
    a: 'Each seller sets their own delivery fee or may offer free delivery. If your cart has items from multiple sellers, delivery fees are calculated separately per seller and combined at checkout.',
  },
  {
    q: 'Can I return a product?',
    a: 'Return policies vary by seller. Please contact the seller directly through your order details, or reach out to us if you need help resolving an issue.',
  },
  {
    q: 'How do I become a seller on LocalMart?',
    a: 'Sign up for an account and select "Seller" during registration. This gives you access to your seller dashboard where you can list products and manage orders.',
  },
  {
    q: 'Is my payment information safe?',
    a: 'Yes. Payments are processed securely through Paystack. LocalMart never stores your card or mobile money credentials directly.',
  },
]

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="bg-green-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-green-800 mb-2">Help Center</h1>
        <p className="text-gray-500 mb-10">
          Find answers to common questions, or get in touch with our support team.
        </p>

        <div className="space-y-3 mb-12">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-medium text-gray-900 text-sm">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 text-sm text-gray-600">{faq.a}</div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-green-100 rounded-xl p-6">
          <h2 className="font-bold text-gray-900 mb-1">Still need help?</h2>
          <p className="text-sm text-gray-600 mb-4">Our support team is here to assist you.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="mailto:support@localmart.com.gh" className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <Mail size={16} />
              support@localmart.com.gh
            </a>
            <a href="tel:+233000000000" className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <Phone size={16} />
              +233 00 000 0000
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}