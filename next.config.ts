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

  // Note: Backend proxying is now handled by src/app/api/py/[...path]/route.ts
  // This was previously done via rewrites() but that had HTTPS issues
};

export default nextConfig;
