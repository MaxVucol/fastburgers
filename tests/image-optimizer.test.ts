// Unit tests of the image optimizer's rules (no database, no browser): what /img agrees to serve, how a picture is identified,
// the cache layers' bookkeeping, single flight, conditional requests, compression and the windowing arithmetic.
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";

const { ALLOWED_WIDTHS } = await import("@/lib/image-config");
const { etagFor, parseImageRequest, variantKey } = await import("@/lib/image-optimizer/params");
const { MemoryImageCache } = await import("@/lib/image-optimizer/memory-cache");
const { Limiter, SingleFlight } = await import("@/lib/single-flight");
const { encodeBody, etagMatches, isCompressible } = await import("@/lib/http-cache");
const { windowRows } = await import("@/lib/virtual-grid");
const { default: imageLoader } = await import("@/lib/image-loader");

const STORE = "store123abc.public.blob.vercel-storage.com";
const query = (u: string, w = "640", q = "75") => new URLSearchParams({ u, w, q });

test("/img: serves shipped pictures, uploads and this project's Blob store, and nothing else", () => {
  assert.equal(parseImageRequest(query("/images/products/margherita/main.webp"), STORE)?.source.kind, "public");
  assert.equal(parseImageRequest(query("/images/categories/Toate categoriile.png"), STORE)?.source.kind, "public");
  assert.equal(parseImageRequest(query("/media/0b6f6e2c-3b0d-4a39-9d3b-2f6d6a3e8c11.webp"), STORE)?.source.kind, "media");
  assert.equal(parseImageRequest(query(`https://${STORE}/uploads/a.webp`), STORE)?.source.kind, "blob");

  for (const refused of [
    `https://evil.example.com/a.webp`,
    `https://${STORE}.evil.example.com/a.webp`,
    `https://other.public.blob.vercel-storage.com/a.webp`,
    `http://${STORE}/a.webp`,
    `https://user:pw@${STORE}/a.webp`,
    `https://${STORE}:8443/a.webp`,
    `https://${STORE}/a.svg`,
    "/images/../../etc/passwd.png",
    "/images/products/../../../.env.png",
    "/images//evil.com/a.png",
    "/images/a.svg",
    "/images/a.png\\..\\b.png",
    "/images/a\u0000.png",
    "/api/secret.png",
    "/media/not-a-uuid.webp",
    "//evil.example.com/a.png",
    "javascript:alert(1)",
    "",
  ]) {
    assert.equal(parseImageRequest(query(refused), STORE), null, refused);
  }
});

test("/img: only the widths and qualities the site's layout asks for are produced", () => {
  const src = "/images/products/margherita/main.webp";
  for (const width of ALLOWED_WIDTHS) assert.ok(parseImageRequest(query(src, String(width)), STORE));
  for (const width of ["0", "-1", "639", "100000", "abc", ""]) assert.equal(parseImageRequest(query(src, width), STORE), null, width);
  for (const quality of ["1", "74", "100", "x"]) assert.equal(parseImageRequest(query(src, "640", quality), STORE), null, quality);
  // Quality is optional (the default of next/image).
  assert.equal(parseImageRequest(new URLSearchParams({ u: src, w: "640" }), STORE)?.quality, 75);
});

test("/img: with no Blob token any Blob store of the platform is accepted, but never another host", () => {
  const fallback = "*.public.blob.vercel-storage.com";
  assert.ok(parseImageRequest(query("https://abc12345.public.blob.vercel-storage.com/a.png"), fallback));
  assert.equal(parseImageRequest(query("https://evil.example.com/a.png"), fallback), null);
  assert.equal(parseImageRequest(query("https://public.blob.vercel-storage.com.evil.com/a.png"), fallback), null);
});

test("picture identity: the key follows source, width and quality; shipped pictures also follow the deployment", () => {
  const shipped = parseImageRequest(query("/images/hero/a.png"), STORE)!;
  const upload = parseImageRequest(query(`https://${STORE}/uploads/a.webp`), STORE)!;
  assert.equal(variantKey(shipped, "v1"), variantKey(shipped, "v1"));
  assert.notEqual(variantKey(shipped, "v1"), variantKey(shipped, "v2"), "a replaced shipped file must not be answered from the old deployment's copy");
  assert.equal(variantKey(upload, "v1"), variantKey(upload, "v2"), "uploads have unique names: their copies outlive deployments");
  const wider = parseImageRequest(query("/images/hero/a.png", "828"), STORE)!;
  const finer = parseImageRequest(query("/images/hero/a.png", "640", "85"), STORE)!;
  assert.equal(new Set([variantKey(shipped, "v1"), variantKey(wider, "v1"), variantKey(finer, "v1")]).size, 3);
  assert.match(etagFor(variantKey(shipped, "v1")), /^"[a-f0-9]{24}"$/);
});

test("ETag: a matching If-None-Match (exact, weak, in a list, or *) means 304; anything else does not", () => {
  const etag = '"abc123"';
  assert.ok(etagMatches('"abc123"', etag));
  assert.ok(etagMatches('W/"abc123"', etag));
  assert.ok(etagMatches('"zzz", "abc123"', etag));
  assert.ok(etagMatches("*", etag));
  assert.ok(!etagMatches('"other"', etag));
  assert.ok(!etagMatches(null, etag));
  assert.ok(!etagMatches("", etag));
});

test("gzip: text is compressed when the client accepts it; pictures never are", async () => {
  assert.ok(isCompressible("image/svg+xml") && isCompressible("application/json") && isCompressible("text/css"));
  assert.ok(!isCompressible("image/webp") && !isCompressible("image/avif") && !isCompressible("image/jpeg"));

  const text = new TextEncoder().encode("<svg>".padEnd(5000, "x") + "</svg>");
  const gzipped = await encodeBody("gzip, deflate, br", "image/svg+xml", text);
  assert.equal(gzipped.encoding, "gzip");
  assert.ok(gzipped.body.byteLength < text.byteLength / 10);
  assert.deepEqual(new Uint8Array(gunzipSync(gzipped.body)), text);

  assert.equal((await encodeBody(null, "image/svg+xml", text)).encoding, undefined);
  assert.equal((await encodeBody("gzip", "image/svg+xml", new Uint8Array(100))).encoding, undefined, "tiny bodies are not worth it");
  const photo = new Uint8Array(5000);
  assert.equal((await encodeBody("gzip", "image/webp", photo)).encoding, undefined);
});

test("L2 memory cache: bounded by bytes, least recently used leaves first, one huge picture is not kept", () => {
  const cache = new MemoryImageCache(100);
  const image = (bytes: number) => ({ body: Buffer.alloc(bytes), contentType: "image/webp" });
  cache.set("a", image(20));
  cache.set("b", image(20));
  cache.set("c", image(20));
  assert.ok(cache.get("a"), "reading a makes it the most recently used");
  cache.set("d", image(24));
  cache.set("e", image(24)); // 20*3 + 24*2 = 108 > 100: the least recently used (b) leaves
  assert.equal(cache.get("b"), undefined);
  assert.ok(cache.get("a") && cache.get("c") && cache.get("d") && cache.get("e"));
  assert.ok(cache.byteSize <= 100);
  cache.set("huge", image(60));
  assert.equal(cache.get("huge"), undefined);
  cache.set("a", image(10)); // replacing an entry replaces its bytes
  assert.equal(cache.byteSize, 10 + 20 + 24 + 24);
});

test("single flight: concurrent requests for one key share one job; a finished or failed job can run again", async () => {
  const flights = new SingleFlight<number>();
  let runs = 0;
  const job = async () => {
    runs++;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return runs;
  };
  const results = await Promise.all(Array.from({ length: 50 }, () => flights.run("same", job)));
  assert.equal(runs, 1);
  assert.deepEqual(new Set(results), new Set([1]));
  assert.equal(flights.size, 0);

  await Promise.all([flights.run("one", job), flights.run("two", job)]);
  assert.equal(runs, 3, "different keys do not share");

  await assert.rejects(flights.run("boom", async () => { throw new Error("x"); }));
  assert.equal(flights.size, 0, "a failure is not remembered");
  assert.equal(await flights.run("boom", async () => 7), 7);
});

test("limiter: never more than the limit at once, and everyone gets their turn", async () => {
  const limiter = new Limiter(2);
  let active = 0;
  let peak = 0;
  const done: number[] = [];
  await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      limiter.run(async () => {
        peak = Math.max(peak, ++active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active--;
        done.push(i);
      }),
    ),
  );
  assert.equal(peak, 2);
  assert.equal(done.length, 8);
});

test("loader: points every picture at /img, leaves pictures already in the browser alone", () => {
  assert.equal(imageLoader({ src: "/images/a b/main.webp", width: 640, quality: 70 }), "/img?u=%2Fimages%2Fa%20b%2Fmain.webp&w=640&q=70");
  assert.equal(imageLoader({ src: "/images/a.png", width: 96 }), "/img?u=%2Fimages%2Fa.png&w=96&q=75");
  assert.equal(imageLoader({ src: "blob:http://localhost/1", width: 96 }), "blob:http://localhost/1");
  assert.equal(imageLoader({ src: "data:image/png;base64,AAAA", width: 96 }), "data:image/png;base64,AAAA");
  // What the loader writes, /img reads back.
  const url = new URL(imageLoader({ src: "/images/categories/Toate categoriile.png", width: 128, quality: 75 }), "http://x");
  assert.equal(parseImageRequest(url.searchParams, STORE)?.src, "/images/categories/Toate categoriile.png");
});

test("virtual grid: renders only the rows near the screen, and the padding keeps the page the same length", () => {
  // 40 rows of 300px with 20px gaps, 4 columns, 160 items.
  const rowHeights = Array.from({ length: 40 }, () => 300);
  const base = { rowHeights, gap: 20, columns: 4, count: 160, overscan: 600 };
  const total = 40 * 300 + 39 * 20;

  const top = windowRows({ ...base, viewTop: 0, viewBottom: 800 });
  assert.equal(top.start, 0);
  assert.equal(top.padTop, 0);
  assert.ok(top.end > 0 && top.end < 160);

  const middle = windowRows({ ...base, viewTop: 6000, viewBottom: 6800 });
  assert.ok(middle.start > 0 && middle.end < 160);
  assert.equal(middle.start % 4, 0, "windows start on a row");
  const renderedRows = Math.ceil((middle.end - middle.start) / 4);
  assert.equal(middle.padTop + renderedRows * 300 + (renderedRows - 1) * 20 + middle.padBottom, total);
  // The rows around the screen are all there.
  const firstShown = middle.padTop;
  const lastShownBottom = middle.padTop + renderedRows * 320 - 20;
  assert.ok(firstShown <= 6000 - 600 && lastShownBottom >= 6800 + 600 - 320);

  const bottom = windowRows({ ...base, viewTop: total - 800, viewBottom: total });
  assert.equal(bottom.end, 160);
  assert.equal(bottom.padBottom, 0);

  // A grid scrolled far past (or before) its end still shows a row rather than nothing.
  assert.ok(windowRows({ ...base, viewTop: 99999, viewBottom: 100800 }).end === 160);
  assert.ok(windowRows({ ...base, viewTop: -99999, viewBottom: -99000 }).start === 0);
  // The last row may be partial.
  const partial = windowRows({ rowHeights: [300, 300, 300], gap: 20, columns: 4, count: 10, viewTop: 0, viewBottom: 5000, overscan: 0 });
  assert.deepEqual([partial.start, partial.end], [0, 10]);
});

test("every <SmartImage quality={…}> in the code is a quality /img agrees to produce (anything else would be a broken picture)", async () => {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { IMAGE_QUALITIES } = await import("@/lib/image-config");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (full.endsWith(".tsx")) files.push(full);
    }
  };
  walk(join(process.cwd(), "app"));
  walk(join(process.cwd(), "components"));
  const bad: string[] = [];
  for (const file of files) {
    for (const match of readFileSync(file, "utf8").matchAll(/\bquality=\{(\d+)\}/g)) {
      if (!IMAGE_QUALITIES.includes(Number(match[1]))) bad.push(`${file}: quality=${match[1]}`);
    }
  }
  assert.deepEqual(bad, []);
});
