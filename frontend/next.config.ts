import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    qualities: [75, 85],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-navigation-menu'],
    serverActions: {
      // Raise the body size limit to 30MB so that large PDF/image uploads
      // via Server Actions and API routes don't return 413 errors.
      bodySizeLimit: '30mb',
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "vidya-school",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
