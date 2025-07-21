/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  serverExternalPackages: ["sharp"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "localhost",
      "127.0.0.1",
      "192.168.1.93",
      "192.168.0.102",
      "192.168.0.103",
      "dptinghir.pythonanywhere.com", // ✅ Pour images depuis backend en production
    ],
    remotePatterns: [
      ...(isDev
        ? [
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
          ]
        : [
            {
              protocol: "https",
              hostname: "dptinghir.pythonanywhere.com",
              pathname: "/media/**",
            },
          ]),
    ],
    unoptimized: true,
  },
  experimental: {
    allowedDevOrigins: [
      "localhost:3000",
      "127.0.0.1:3000",
      "192.168.1.93:3000",
      "192.168.0.102:3000",
      "192.168.0.103:3000",
    ],
  },
  async rewrites() {
    if (isDev) {
      return [
        {
          source: "/api/:path*",
          destination: "http://192.168.0.103:8000/api/:path*",
        },
      ];
    }
    return [];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // ⚠️ à restreindre si besoin
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
    ];
  },
};

module.exports = nextConfig;
