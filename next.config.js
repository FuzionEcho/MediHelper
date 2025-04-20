/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["placeholder.com"],
    unoptimized: true,
  },
  // Add experimental server actions configuration
  experimental: {
    serverActions: true,
  },
  // No need to expose any environment variables to the client
}

module.exports = nextConfig
