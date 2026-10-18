"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Heart } from "lucide-react";
import { favoriteStateAction, mergeFavoritesAction, toggleFavoriteAction } from "@/actions/customer";
import { useI18n } from "@/components/i18n/i18n-provider";
import { readGuestFavorites, subscribeGuestFavorites, toggleGuestFavorite, writeGuestFavorites } from "@/lib/guest-favorites";
import { cn } from "@/lib/utils";

/**
 * Heart toggle on a dish page or, as the "card" variant, on a catalog card. It works for everyone:
 * a signed-in customer's favourites live in the account; a visitor without an account keeps them in
 * this browser, and they join the account the first time the visitor is signed in. The account state is read
 * after hydration (the page itself stays cached for everyone); a card has many hearts, so each one
 * reads it only when the pointer or keyboard first reaches it.
 */
export function FavoriteButton({
  productId,
  className,
  variant = "page",
}: {
  productId: string;
  className?: string;
  variant?: "page" | "card";
}) {
  const { t } = useI18n();
  const [account, setAccount] = useState<{ signedIn: boolean; favorite: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  // The browser's own list (a visitor without an account); the server renders it as "not a favourite".
  const kept = useSyncExternalStore(
    subscribeGuestFavorites,
    () => readGuestFavorites().includes(productId),
    () => false,
  );

  const requested = useRef(false);
  const load = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    favoriteStateAction(productId)
      .then(async (state) => {
        setAccount(state);
        if (!state.signedIn) return;
        // Signed in: whatever was collected in this browser before joins the account, once.
        const ids = readGuestFavorites();
        if (ids.length === 0) return;
        await mergeFavoritesAction(ids);
        writeGuestFavorites([]);
        setAccount(await favoriteStateAction(productId));
      })
      .catch(() => {
        requested.current = false;
      });
  }, [productId]);

  useEffect(() => {
    if (variant === "page") load();
  }, [variant, load]);

  function toggle() {
    startTransition(async () => {
      try {
        const state = account ?? (await favoriteStateAction(productId));
        if (state.signedIn) {
          const next = await toggleFavoriteAction(productId);
          if (next.signedIn) {
            setAccount(next);
            return;
          }
        }
        // No account (or the session ended a moment ago): the browser keeps it.
        setAccount({ signedIn: false, favorite: false });
        toggleGuestFavorite(productId);
      } catch {
        // Network error: keep the previous state.
      }
    });
  }

  const favorite = account?.signedIn ? account.favorite : kept;
  const label = favorite ? t.me.favorites.remove : t.me.favorites.add;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      onPointerEnter={load}
      onFocus={load}
      aria-pressed={favorite}
      aria-label={label}
      title={label}
      className={cn(
        variant === "card"
          ? cn("grid size-9 shrink-0 place-items-center rounded-full disabled:opacity-60", favorite ? "text-accent-ink" : "text-ink hover:text-accent-ink")
          : cn(
              "grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-[var(--duration-fast)] disabled:opacity-60",
              favorite ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink hover:border-ink/35",
            ),
        className,
      )}
    >
      <Heart className={cn(variant === "card" ? "size-6" : "size-5", favorite && "fill-current")} aria-hidden strokeWidth={variant === "card" ? 1.8 : 1.9} />
    </button>
  );
}
