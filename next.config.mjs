/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  async headers() {
    return [
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
