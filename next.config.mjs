/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,
  
  // Add this configuration to address the cross-origin warning
  experimental: {
    allowedDevOrigins: ['192.168.1.144'],
  },
  
  // Image configuration
  images: {
    domains: ['hztnrwbtfyycrmciketh.supabase.co'],
    unoptimized: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
