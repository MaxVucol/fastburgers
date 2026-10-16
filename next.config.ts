import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    // Two root layouts (app/[lang] for the site, app/admin) → app/global-not-found.tsx.
    globalNotFound: true,
    // Admin product forms upload images (main + gallery) through Server Actions.
    serverActions: {
      bodySizeLimit: "20mb",
    },
    proxyClientMaxBodySize: "20mb",
    optimizePackageImports: ["lucide-react"],
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 85],
    // Product photos change rarely and every one has its own URL: keep the optimized copies for a month
    // (the default is a minute), and only generate the widths the layout actually asks for.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [48, 64, 96, 128, 256, 384],
    // Admin uploads are stored in Vercel Blob in production (see lib/storage.ts).
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  // The pictures in /public/images are part of the site, not user uploads: browsers and the CDN keep them
  // for a month (and may show the old one for a day while fetching a changed one).
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
  serverExternalPackages: ["sharp"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
