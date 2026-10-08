"use client";

import { useSyncExternalStore } from "react";
import { MAX_ITEM_QUANTITY } from "@/lib/pricing";
import type { CartLine, CartOption } from "@/types/cart";

// A tiny external store: no provider needed, persisted in localStorage and synced
// across tabs. The server snapshot is always empty, so hydration never mismatches.

type CartState = {
  lines: CartLine[];
  open: boolean;
  /** Increments on every add — drives the badge "pop" animation. */
  bump: number;
};

const STORAGE_KEY = "fb-cart-v1";
const EMPTY: CartState = { lines: [], open: false, bump: 0 };

let state: CartState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function isOption(value: unknown): value is CartOption {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.name === "string" && typeof v.price === "number";
}

function isLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.key === "string" &&
    typeof v.productId === "string" &&
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    typeof v.image === "string" &&
    typeof v.basePrice === "number" &&
    typeof v.quantity === "number" &&
    Array.isArray(v.options) &&
    v.options.every(isOption)
  );
}

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    return [];
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = { ...state, lines: readStorage() };
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = { ...state, lines: readStorage() };
    emit();
  });
}

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: Partial<CartState>, persist = true) {
  state = { ...state, ...next };
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Storage may be full or disabled (private mode) — the cart still works in memory.
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

function getServerSnapshot() {
  return EMPTY;
}

export function lineKey(productId: string, options: CartOption[]) {
  return [productId, ...options.map((o) => o.id).sort()].join(":");
}

export function lineUnitPrice(line: Pick<CartLine, "basePrice" | "options">) {
  return line.basePrice + line.options.reduce((sum, o) => sum + o.price, 0);
}

export const cartActions = {
  add(item: Omit<CartLine, "key" | "quantity">, quantity = 1, openDrawer = false) {
    ensureLoaded();
    const key = lineKey(item.productId, item.options);
    const existing = state.lines.find((l) => l.key === key);
    const lines = existing
      ? state.lines.map((l) =>
          l.key === key ? { ...l, quantity: Math.min(MAX_ITEM_QUANTITY, l.quantity + quantity) } : l,
        )
      : [...state.lines, { ...item, key, quantity: Math.min(MAX_ITEM_QUANTITY, quantity) }];
    setState({ lines, bump: state.bump + 1, open: openDrawer || state.open });
  },
  setQuantity(key: string, quantity: number) {
    const q = Math.max(0, Math.min(MAX_ITEM_QUANTITY, Math.round(quantity)));
    const lines =
      q === 0
        ? state.lines.filter((l) => l.key !== key)
        : state.lines.map((l) => (l.key === key ? { ...l, quantity: q } : l));
    setState({ lines });
  },
  remove(key: string) {
    setState({ lines: state.lines.filter((l) => l.key !== key) });
  },
  clear() {
    setState({ lines: [] });
  },
  open() {
    setState({ open: true }, false);
  },
  close() {
    setState({ open: false }, false);
  },
};

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards — avoids flashing "empty cart" UI. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = snapshot.lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = snapshot.lines.reduce((sum, l) => sum + lineUnitPrice(l) * l.quantity, 0);
  return { ...snapshot, count, subtotal };
}
