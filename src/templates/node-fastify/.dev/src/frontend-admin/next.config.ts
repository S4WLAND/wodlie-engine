import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.MINIO_PUBLIC_URL?.replace('https://', '') || '',
      },
    ],
  },
}

export default nextConfig
