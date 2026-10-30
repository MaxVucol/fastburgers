"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef } from "react";
import { IMAGE_ENDPOINT } from "@/lib/image-config";
import { vaultGet, vaultPut } from "@/lib/image-vault";

/**
 * The one picture component of the site: next/image (sizes, srcset, lazy loading, blur-free layout) whose
 * addresses point at the site's own optimizer (lib/image-loader.ts), plus the browser-side layer of the cache:
 *
 *  - a picture that is not on the screen yet is looked up in IndexedDB first; if the browser has it from an
 *    earlier visit it is shown from there, with no request at all;
 *  - a picture that has loaded is copied to IndexedDB (when the browser is idle), from the HTTP cache the page
 *    just filled, so the copy costs no download.
 *
 * Import this, not "next/image" (eslint enforces it).
 */
export function SmartImage(props: ImageProps) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    const keep = () => {
      const url = optimizedUrl(img.currentSrc);
      if (url && !objectUrl) remember(url);
    };

    const fromVault = async () => {
      // A picture that has not started loading (lazy, below the screen) has no currentSrc yet: take the candidate it will need.
      const url = optimizedUrl(img.currentSrc) ?? optimizedUrl(candidateFor(img));
      if (!url) return;
      const blob = await vaultGet(url);
      // The page may have moved on while IndexedDB answered, or the picture arrived over the network first.
      if (!blob || cancelled || (img.complete && img.naturalWidth > 0)) return;
      objectUrl = URL.createObjectURL(blob);
      img.srcset = "";
      img.src = objectUrl;
    };

    if (img.complete && img.naturalWidth > 0) keep();
    else {
      img.addEventListener("load", keep, { once: true });
      void fromVault();
    }

    return () => {
      cancelled = true;
      img.removeEventListener("load", keep);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  // eslint-disable-next-line jsx-a11y/alt-text -- `alt` is required by ImageProps and arrives with the props
  return <Image {...props} ref={ref} />;
}

/**
 * The srcset entry the browser will pick for this element: the smallest picture that is wide enough for the box the
 * picture is shown in (at the screen's pixel density). Empty for a picture that is not laid out (a closed dialog).
 */
function candidateFor(img: HTMLImageElement): string {
  const box = img.getBoundingClientRect().width * window.devicePixelRatio;
  if (!box) return "";
  const entries = img.srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/))
    .filter(([url, descriptor]) => url && descriptor)
    .map(([url, descriptor]) => ({ url, size: parseFloat(descriptor), pixels: descriptor.endsWith("w") }));
  const widths = entries.filter((entry) => entry.pixels).sort((a, b) => a.size - b.size);
  if (widths.length > 0) return (widths.find((entry) => entry.size >= box) ?? widths[widths.length - 1]).url;
  // "1x, 2x" candidates (a picture with a fixed size and no `sizes`).
  const densities = entries.sort((a, b) => a.size - b.size);
  return (densities.find((entry) => entry.size >= window.devicePixelRatio) ?? densities[densities.length - 1])?.url ?? "";
}

/** The /img URL (path and query) an <img> chose or will choose, or null for anything else (data:, blob:, a picture from elsewhere). */
function optimizedUrl(currentSrc: string): string | null {
  if (!currentSrc) return null;
  try {
    const url = new URL(currentSrc, location.href);
    return url.origin === location.origin && url.pathname === IMAGE_ENDPOINT ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}

const seen = new Set<string>();
const queue: string[] = [];
let draining = false;

/** Queues a picture for IndexedDB, once per page visit; they are copied one at a time, when the browser is idle. */
function remember(url: string) {
  if (seen.has(url)) return;
  seen.add(url);
  queue.push(url);
  if (!draining) void drain();
}

async function drain() {
  draining = true;
  while (queue.length > 0) {
    await idle();
    const url = queue.shift()!;
    try {
      if (await vaultGet(url)) continue;
      // The same URL the <img> used, so the HTTP cache answers (the server sends no Vary: one URL, one picture).
      const response = await fetch(url, { cache: "force-cache" });
      if (response.ok) await vaultPut(url, await response.blob());
    } catch {
      // Offline or blocked: the picture is simply not copied.
    }
  }
  draining = false;
}

function idle(): Promise<void> {
  return new Promise((resolve) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve(), { timeout: 2000 });
    else setTimeout(resolve, 200);
  });
}
