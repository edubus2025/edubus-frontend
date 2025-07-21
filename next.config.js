/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["localhost", "192.168.1.93", "192.168.0.102", "192.168.0.103", "127.0.0.1"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "192.168.1.93",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "192.168.0.102",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "192.168.0.103",
        port: "8000",
        pathname: "/media/**",
      },
    ],
    unoptimized: true,
  },
  // Configuration pour résoudre l'avertissement Cross Origin
  experimental: {
    allowedDevOrigins: ["192.168.0.102:3000", "192.168.0.103:3000" , "192.168.1.93:3000", "localhost:3000", "127.0.0.1:3000"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://192.168.0.103:8000/api/:path*",
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
