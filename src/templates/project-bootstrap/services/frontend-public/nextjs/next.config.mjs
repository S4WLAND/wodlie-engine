const minioHostname = process.env.MINIO_PUBLIC_URL?.replace(/^https?:\/\//, '') || null

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    typedRoutes: true,
  },
  compiler: {
    // Elimina console.log en producción; conserva console.error y console.warn
    removeConsole: { exclude: ['error', 'warn'] },
  },
  images: {
    remotePatterns: minioHostname
      ? [
          {
            protocol: 'https',
            hostname: minioHostname,
          },
        ]
      : [],
  },
}

export default nextConfig
