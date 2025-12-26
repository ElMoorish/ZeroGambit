import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // Required for Docker deployment

  // Use empty turbopack config to allow webpack config
  // Next.js 16 requires this when both are present
  turbopack: {},

  // Exclude video and api folders from Next.js compilation
  // These are separate projects (Remotion, FastAPI)
  webpack: (config) => {
    // Ignore video folder during webpack compilation
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/video/**',
        '**/api/**',
      ]
    };

    return config;
  },

  // TypeScript config
  typescript: {
    ignoreBuildErrors: false,
  },

  // Rewrites to proxy requests to Python backend
  // Frontend calls: /api/py/api/health -> Backend: /api/health
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/py/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
};

export default nextConfig;
