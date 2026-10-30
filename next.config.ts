import type { NextConfig } from "next";
import { DEVICE_SIZES, IMAGE_QUALITIES, IMAGE_SIZES } from "./lib/image-config";
import { securityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  // No "X-Powered-By: Next.js" header, and no source maps for the browser bundles: readers of the site get
  // the minified code only.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
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
    // Pictures are not optimised by Vercel's /_next/image (every distinct picture/width/quality is a billed
    // "transformation"), but by the site's own /img route (app/img, lib/image-optimizer) with a three-layer cache.
    // The loader only builds the /img address; the widths and qualities below are what `srcset` offers and what
    // /img agrees to produce (lib/image-config.ts).
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    qualities: IMAGE_QUALITIES,
    deviceSizes: DEVICE_SIZES,
    imageSizes: IMAGE_SIZES,
  },
  // The pictures in /public/images are part of the site, not user uploads: browsers and the CDN keep them
  // for a month (and may show the old one for a day while fetching a changed one).
  async headers() {
    return [
      securityHeaders(),
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
