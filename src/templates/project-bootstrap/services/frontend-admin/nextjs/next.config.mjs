function getMediaRemotePattern() {
  if (!process.env.MEDIA_PUBLIC_URL) return null

  try {
    const url = new URL(process.env.MEDIA_PUBLIC_URL)
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port,
      pathname: '/**',
    }
  } catch {
    return null
  }
}

const mediaRemotePattern = getMediaRemotePattern()
const shouldUseWebpackPolling = process.env.WATCHPACK_POLLING === 'true'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [],
  typedRoutes: true,
  compiler: {
    removeConsole: { exclude: ['error', 'warn'] },
  },
  turbopack: {},
  ...(shouldUseWebpackPolling
    ? {
        // Polling para HMR en Docker + Windows host.
        webpack: (config, { dev }) => {
          if (dev) {
            config.watchOptions = {
              poll: 500,
              aggregateTimeout: 300,
            }
          }
          return config
        },
      }
    : {}),
  images: {
    remotePatterns: mediaRemotePattern ? [mediaRemotePattern] : [],
  },
}

export default nextConfig
