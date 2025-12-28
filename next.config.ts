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
    let backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

    // Log for debugging
    console.log('[next.config] Original BACKEND_URL:', backendUrl);

    // FORCE HTTPS for trycloudflare URLs - replace any http with https
    if (backendUrl.includes('trycloudflare.com')) {
      backendUrl = backendUrl.replace(/^http:\/\//i, 'https://');
      // Ensure it starts with https
      if (!backendUrl.startsWith('https://')) {
        backendUrl = 'https://' + backendUrl.replace(/^https?:\/\//i, '');
      }
    }

    console.log('[next.config] Final BACKEND_URL:', backendUrl);

    return [
      {
        source: '/api/py/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
};

export default nextConfig;
