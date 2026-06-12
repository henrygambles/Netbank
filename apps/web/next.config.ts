import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: { typedRoutes: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'cryptologos.cc' },
    ],
  },
  transpilePackages: ['@netbank/ui', '@netbank/types'],
}

export default config
