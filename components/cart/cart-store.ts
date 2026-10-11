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

/**
 * Accessible name of a cart line: the dish plus its extras, so two lines of the same dish
 * (with and without extras) get distinct "remove" / quantity button names.
 * `optionLabel` translates the stored (canonical) option names.
 */
export function lineLabel(line: Pick<CartLine, "name" | "options">, optionLabel: (name: string) => string) {
  return line.options.length > 0 ? `${line.name} (+ ${line.options.map((o) => optionLabel(o.name)).join(", ")})` : line.name;
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
  /** Updates line prices from the server's current ones (after a "prices changed" checkout answer). */
  reprice(updates: { productId: string; price: number; options: { id: string; price: number }[] }[]) {
    const byId = new Map(updates.map((u) => [u.productId, u]));
    const lines = state.lines.map((l) => {
      const u = byId.get(l.productId);
      if (!u) return l;
      return {
        ...l,
        basePrice: u.price,
        options: l.options.map((o) => ({ ...o, price: u.options.find((x) => x.id === o.id)?.price ?? o.price })),
      };
    });
    setState({ lines });
  },
  /**
   * Removes what the server reported as no longer orderable — whole products, or single options
   * (the line keeps the dish without them, merged with an identical line if there is one).
   * Only called when the customer asks for it.
   */
  removeUnavailable(items: { productId: string; optionId?: string }[]) {
    const gone = new Set(items.filter((i) => !i.optionId).map((i) => i.productId));
    const merged = new Map<string, CartLine>();
    for (const line of state.lines) {
      if (gone.has(line.productId)) continue;
      const drop = new Set(items.filter((i) => i.productId === line.productId && i.optionId).map((i) => i.optionId));
      const options = drop.size > 0 ? line.options.filter((o) => !drop.has(o.id)) : line.options;
      const key = lineKey(line.productId, options);
      const same = merged.get(key);
      merged.set(
        key,
        same ? { ...same, quantity: Math.min(MAX_ITEM_QUANTITY, same.quantity + line.quantity) } : { ...line, key, options },
      );
    }
    setState({ lines: [...merged.values()] });
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
