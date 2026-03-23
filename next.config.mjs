/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  // Puppeteer ships native bits; bundling it into Route Handlers can break or crash at runtime (especially with Turbopack).
  serverExternalPackages: ['puppeteer'],

  // Enable strict mode for better development experience
  reactStrictMode: true,
  
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hztnrwbtfyycrmciketh.supabase.co',
      },
    ],
    unoptimized: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  

  
  // Exclude test pages from production builds
  async redirects() {
    // Only apply redirects in production
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/:path(test-.*)',
          destination: '/',
          permanent: false,
        },
      ]
    }
    return []
  },
}

export default nextConfig
=======
  images: {},
  output: 'standalone',
  compress: true,
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ['ioredis'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@remixicon/react',
      'recharts',
      'date-fns',
    ],
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000', '192.168.1.144:3000'],
    },
  },
  devIndicators: {
    appIsrStatus: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'",
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
>>>>>>> c10aaa83c3737af90b384d046150aef9f7900c99
