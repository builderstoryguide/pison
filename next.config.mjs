/** @type {import('next').NextConfig} */
const nextConfig = {
  // Puppeteer ships native bits; bundling it into Route Handlers can break or crash at runtime (especially with Turbopack).
  serverExternalPackages: ['puppeteer'],
  experimental: {
    // Dev tools can bounce between localhost and 127.0.0.1; allow both loopback origins.
    allowedDevOrigins: ['localhost', '127.0.0.1', '[::1]'],
  },

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
