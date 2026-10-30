"use client";

import { IMAGE_ENDPOINT } from "@/lib/image-config";

/**
 * next/image's loader for the whole site (next.config.ts → images.loaderFile): every <Image> asks the site's
 * own optimizer (app/img/route.ts) instead of Vercel's /_next/image. Pictures that are already in the browser
 * (previews of a file being uploaded) are left alone.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  return `${IMAGE_ENDPOINT}?u=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
