import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker/production deployments
  output: 'standalone',

  // Optimize heavy dependencies
  experimental: {
    optimizePackageImports: [
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'jspdf',
      'xlsx',
    ],
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Redirect old routes to new structure (if needed)
  async redirects() {
    return [
      // Redirect /events to /dashboard (new structure)
      {
        source: '/events',
        destination: '/dashboard',
        permanent: true,
      },
      // Redirect old event routes to new dashboard structure
      {
        source: '/events/:eventId',
        destination: '/dashboard/events/:eventId',
        permanent: true,
      },
      {
        source: '/events/:eventId/:view',
        destination: '/dashboard/events/:eventId/:view',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
