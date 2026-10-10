import { Caveat, Inter, Montserrat } from "next/font/google";

// All three families cover Latin (incl. Romanian ș/ț) and Cyrillic: every subset is declared
// with its unicode-range, and the browser fetches a file only when a page uses its characters.
// `subsets` lists only what is *preloaded*: Latin and Latin Extended (Romanian is the default
// locale). Cyrillic loads on demand on /ru — preloading it everywhere put ~40 KB more ahead of
// the hero photo (the mobile LCP); measured on throttled mobile, LCP went from ~2.0 s to ~1.5 s.

/**
 * Display: BUNIQ wordmark, headlines, prices and accents — geometric, dense.
 * Variable font (no `weight`): one file per subset covers 600–800 instead of three.
 */
export const fontHeading = Montserrat({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/** Body and interface text. */
export const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/** Handwritten brand annotations — decorative notes only, so it is not preloaded. */
export const fontHand = Caveat({
  variable: "--font-hand",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["700"],
  display: "swap",
  preload: false,
});

export const fontVariables = `${fontHeading.variable} ${fontBody.variable} ${fontHand.variable}`;
