// Favourites of a visitor without an account: product ids kept in this browser (localStorage). Nothing
// is sent to the server until the visitor signs in; then FavoriteButton hands them to mergeFavoritesAction.
// Browser only; every access is wrapped because storage can be blocked (private windows, site settings).

const KEY = "fb_favorites";
const EVENT = "fb:favorites";
export const MAX_GUEST_FAVORITES = 100;

/** Used when the browser refuses storage, so the heart still works until the page is closed. */
let memory: string[] = [];

const isId = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);

export function readGuestFavorites(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter(isId))].slice(0, MAX_GUEST_FAVORITES) : [];
  } catch {
    return memory;
  }
}

export function writeGuestFavorites(ids: string[]): void {
  memory = ids.slice(0, MAX_GUEST_FAVORITES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_GUEST_FAVORITES)));
  } catch {
    // Storage is unavailable: the heart still reacts for this page view only.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Adds or removes `id`; returns whether it is a favourite now. */
export function toggleGuestFavorite(id: string): boolean {
  const ids = readGuestFavorites();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
  writeGuestFavorites(next);
  return next.includes(id);
}

export function subscribeGuestFavorites(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
