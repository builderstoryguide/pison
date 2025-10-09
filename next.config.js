/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this configuration to address the cross-origin warning

  eslint: {
    ignoreDuringBuilds: true,
  }, 
  
  experimental: {
    allowedDevOrigins: ['192.168.1.144']
  },
  
  // Optional: Add other optimizations
  images: {
    domains: ['hztnrwbtfyycrmciketh.supabase.co'],
  },
  
  // Enable strict mode for better development experience
  reactStrictMode: true,
  
}

module.exports = nextConfig
