/** @type {import('next').NextConfig} */
const minioHostname = process.env.MINIO_PUBLIC_URL?.replace('https://', '').replace('http://', '') || null

const nextConfig = {
  output: 'standalone',
  experimental: {
    typedRoutes: true,
  },
  ...(minioHostname && {
    images: {
      remotePatterns: [{ protocol: 'https', hostname: minioHostname }],
    },
  }),
}

export default nextConfig
