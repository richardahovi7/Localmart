import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LocalMart — Shop Local, Support Local',
  description: 'A marketplace for local businesses in Ghana',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
