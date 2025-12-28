import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // Required for Docker deployment

  // Use empty turbopack config to allow webpack config
  // Next.js 16 requires this when both are present
  turbopack: {},

  // Exclude video and Python API folders from Next.js compilation
  // These are separate projects (Remotion, FastAPI)
  // Note: Must be careful not to exclude src/app/api which contains Next.js API routes!
  webpack: (config) => {
    // Ignore video folder and root-level api folder during webpack compilation
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/video/**',
        // Only ignore the root-level api folder (FastAPI backend), not src/app/api
        /^api\//,  // Matches only "api/" at the start, not "src/app/api/"
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
