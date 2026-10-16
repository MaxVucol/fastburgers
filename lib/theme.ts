/**
 * Site theme: the original light BUNIQ or Dark Premium, set as `data-theme` on <html>.
 * The visitor's explicit choice is kept in localStorage; without one the system theme is used
 * (and followed while the page is open). Applied by an inline script before the first paint,
 * so there is no flash of the wrong theme; the header switch changes it afterwards.
 */
export const THEME_STORAGE_KEY = "buniq-theme";

export type Theme = "light" | "dark";

/** The theme to show: the saved choice, else the system theme. Browser only. */
export function preferredTheme(): Theme {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Storage blocked: fall back to the system theme.
  }
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Inline <head> script: same rule as preferredTheme, tiny and dependency-free (runs during HTML parsing). */
export const themeInitScript = `(function(){var d=document.documentElement,k=${JSON.stringify(
  THEME_STORAGE_KEY,
)},m=window.matchMedia("(prefers-color-scheme: dark)");function s(){var t=null;try{t=localStorage.getItem(k)}catch(e){}d.setAttribute("data-theme",t==="dark"||t==="light"?t:m.matches?"dark":"light")}s();m.addEventListener("change",s)})()`;

/**
 * The admin panel's variant: the same saved choice (one key for site and panel), but without one
 * the panel opens in its dark graphite theme instead of following the system.
 */
export const adminThemeInitScript = `(function(){var t=null;try{t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")})()`;
