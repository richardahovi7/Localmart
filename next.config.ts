import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // Type checking is done separately; allows build without generated Prisma client
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
