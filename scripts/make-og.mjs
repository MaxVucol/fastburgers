// Builds the branded social preview (Open Graph / Twitter card), 1200×630 JPEG:
// the BUNIQ wordmark and slogan on cream, the hero burger in a graphite panel with a slanted
// edge — the same composition as the first screen of the site.
//   node scripts/make-og.mjs   (or: npm run og:build)
// Uses only what the project already ships: `next/og` (Satori) for layout and text, `sharp`
// for the photo and the JPEG. Montserrat (SIL Open Font License) is fetched from Google Fonts
// for the render only — no font file is stored in the repo.
import sharp from "sharp";
import { ImageResponse } from "next/og.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const W = 1200;
const H = 630;
const PHOTO_W = 600; // the photo panel on the right, edge slanted like the hero
const SRC = path.join(process.cwd(), "public", "images", "hero", "hero.webp");
const OUT = path.join(process.cwd(), "public", "images", "og", "buniq.jpg");

// Brand tokens (app/globals.css).
const cream = "#f6f3ea";
const ink = "#242424";
const inkSoft = "#3b3a37";
const accent = "#ff6b2e";

/** Static Montserrat TTFs: without a browser user agent the CSS API serves TrueType. */
async function montserrat(weights) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Montserrat:wght@${weights.join(";")}`)).text();
  const faces = [...css.matchAll(/font-weight:\s*(\d+);[\s\S]*?src:\s*url\(([^)]+\.ttf)\)/g)];
  if (faces.length !== weights.length) throw new Error(`Expected ${weights.length} Montserrat faces, got ${faces.length}`);
  return Promise.all(
    faces.map(async ([, weight, url]) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Font download failed: ${res.status}`);
      return { name: "Montserrat", data: await res.arrayBuffer(), weight: Number(weight), style: "normal" };
    }),
  );
}

/** The hero photo cropped to the panel; the burger sits where it does on desktop (58% / 28%). */
async function photo() {
  const src = sharp(await readFile(SRC));
  const { width, height } = await src.metadata();
  const scale = Math.max(PHOTO_W / width, H / height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const jpeg = await src
    .resize(w, h)
    .extract({ left: Math.round((w - PHOTO_W) * 0.58), top: Math.round((h - H) * 0.28), width: PHOTO_W, height: H })
    .jpeg({ quality: 90 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

const el = (type, style, children, extra = {}) => ({ type, props: { style, children, ...extra } });
const svg = (viewBox, style, paths, stroke) =>
  el("svg", style, paths.map((d) => ({ type: "path", props: { d } })), {
    viewBox,
    fill: "none",
    stroke,
    strokeWidth: 3.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  });

// Same paths as components/ui/brand.tsx.
const crown = (style, color = accent) => svg("0 0 48 36", style, ["M8.5 25.5 5 8.5l10.6 8.6L24 4l8.4 13.1L43 8.5l-3.5 17Z", "M9.5 31.5h29"], color);
const swash = (style) =>
  el("svg", style, [{ type: "path", props: { d: "M3 11c22-6 58-9 86-6 9 1 17 3 28 1" } }], {
    viewBox: "0 0 120 16",
    preserveAspectRatio: "none",
    fill: "none",
    stroke: accent,
    strokeWidth: 3.5,
    strokeLinecap: "round",
  });

const [fonts, photoUri] = await Promise.all([montserrat([600, 800]), photo()]);

const tree = el("div", { display: "flex", width: W, height: H, background: cream, fontFamily: "Montserrat", color: ink, position: "relative" }, [
  // ── Copy ──
  el("div", { display: "flex", flexDirection: "column", justifyContent: "space-between", width: W - PHOTO_W + 40, padding: "68px 0 72px 80px" }, [
    // Wordmark: crown over BUNIQ, tagline underneath (as in components/layout/logo.tsx).
    el("div", { display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "flex-start" }, [
      crown({ width: 54, height: 40, marginBottom: 2, marginLeft: -50, transform: "rotate(-10deg)" }),
      el("div", { fontSize: 84, fontWeight: 800, letterSpacing: -3.8, lineHeight: 0.8 }, "BUNIQ"),
      el("div", { marginTop: 18, paddingLeft: 6, fontSize: 19, fontWeight: 600, letterSpacing: 6, color: inkSoft }, "BURGERS & MORE"),
    ]),
    el("div", { display: "flex", flexDirection: "column", fontSize: 74, fontWeight: 800, letterSpacing: -2.6, lineHeight: 1.04 }, [
      el("div", {}, "Real Burgers."),
      el("div", { display: "flex", position: "relative", alignSelf: "flex-start" }, [
        "Better Days.",
        swash({ position: "absolute", left: 2, bottom: -18, width: "96%", height: 20 }),
      ]),
    ]),
  ]),
  // ── Photo panel ──
  el("div", { display: "flex", position: "absolute", top: 0, right: 0, width: PHOTO_W, height: H, background: ink }, [
    el("img", { position: "absolute", top: 0, left: 0, width: PHOTO_W, height: H }, undefined, { src: photoUri, width: PHOTO_W, height: H }),
    // The slanted edge: a cream wedge over the photo's left side.
    el("svg", { position: "absolute", top: 0, left: 0, width: 130, height: H }, [{ type: "path", props: { d: `M0 0H130L0 ${H}Z`, fill: cream } }], {
      viewBox: `0 0 130 ${H}`,
    }),
    crown({ position: "absolute", top: 58, right: 64, width: 92, height: 69, transform: "rotate(14deg)" }),
  ]),
]);

const png = Buffer.from(await new ImageResponse(tree, { width: W, height: H, fonts }).arrayBuffer());
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toBuffer());
console.log("ok", path.relative(process.cwd(), OUT));
