/** @type {import('next').NextConfig} */
const nextConfig = {
  // Puppeteer ships native bits; bundling it into Route Handlers can break or crash at runtime (especially with Turbopack).
  serverExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium'],
  experimental: {
    // Dev tools can bounce between localhost and 127.0.0.1; allow both loopback origins.
    allowedDevOrigins: ['localhost', '127.0.0.1', '[::1]'],
  },

  // Enable strict mode for better development experience
  reactStrictMode: true,
  
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Ensure Chromium brotli binaries are present in serverless bundles.
  // Without these traced files, @sparticuz/chromium throws:
  // "input directory .../bin does not exist. Please provide the location of the brotli file"
  outputFileTracingIncludes: {
    '/api/report-cards/pdf': [
      './node_modules/@sparticuz/chromium/bin/**',
      './node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**',
    ],
    '/app/api/report-cards/pdf/route': [
      './node_modules/@sparticuz/chromium/bin/**',
      './node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**',
    ],
    '/api/financial-reports': [
      './node_modules/@sparticuz/chromium/bin/**',
      './node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**',
    ],
    '/app/api/financial-reports/route': [
      './node_modules/@sparticuz/chromium/bin/**',
      './node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**',
    ],
  },
  
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
