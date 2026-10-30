// The sizes the site's pictures are produced in. One list for three readers: next.config.ts (which widths
// `srcset` offers), the loader in the browser (the URL it builds) and the /img route (which widths it will
// agree to produce). A width or quality outside the lists is refused, so nobody can make the server
// render an endless number of variants of one photo.

export const DEVICE_SIZES = [360, 480, 640, 828, 1080, 1280, 1600, 1920];
export const IMAGE_SIZES = [48, 64, 96, 128, 256, 384];
export const IMAGE_QUALITIES = [70, 75, 85];

export const ALLOWED_WIDTHS: readonly number[] = [...IMAGE_SIZES, ...DEVICE_SIZES].sort((a, b) => a - b);

/** Where the optimizer lives. The proxy leaves this path alone (no language prefix). */
export const IMAGE_ENDPOINT = "/img";

/** Browsers and the CDN keep a variant for a month; after that they ask again with If-None-Match and get a 304. */
export const IMAGE_MAX_AGE = 60 * 60 * 24 * 30;
