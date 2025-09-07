/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ethers'],
  
  // Enable standalone output for Docker
  output: 'standalone',

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's2.coinmarketcap.com',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Environment variables to expose to the client
  env: {
    OG_CHAIN_ID: process.env.OG_CHAIN_ID,
    OG_NETWORK_NAME: process.env.OG_NETWORK_NAME,
    OG_CHAIN_EXPLORER: process.env.OG_CHAIN_EXPLORER,
    OG_STORAGE_EXPLORER: process.env.OG_STORAGE_EXPLORER,
  },
  
  // Webpack configuration for 0G SDK
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    return config
  },
}

export default nextConfig
