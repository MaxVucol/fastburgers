import { Caveat, Inter, Oswald } from "next/font/google";

// All three families cover Latin (incl. Romanian ș/ț) and Cyrillic.

/** Display: condensed, poster-like headlines. */
export const fontHeading = Oswald({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/** Body and interface text. */
export const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

/** Handwritten brand annotations — used in a few deliberate places only. */
export const fontHand = Caveat({
  variable: "--font-hand",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["700"],
  display: "swap",
});

export const fontVariables = `${fontHeading.variable} ${fontBody.variable} ${fontHand.variable}`;
