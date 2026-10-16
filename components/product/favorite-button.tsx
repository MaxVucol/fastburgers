"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { favoriteStateAction, toggleFavoriteAction } from "@/actions/customer";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

/**
 * Heart toggle on a dish page or, as the "card" variant, on a catalog card. The state is read after
 * hydration (the page itself stays cached for everyone); a card has many hearts, so each one reads
 * it only when the pointer or keyboard first reaches it. A guest is sent to sign-in and comes back.
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
  const { t, href } = useI18n();
  const router = useRouter();
  const [state, setState] = useState<{ signedIn: boolean; favorite: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  const requested = useRef(false);
  const load = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    favoriteStateAction(productId)
      .then(setState)
      .catch(() => {
        requested.current = false;
      });
  }, [productId]);

  useEffect(() => {
    if (variant === "page") load();
  }, [variant, load]);

  function toggle() {
    if (state && !state.signedIn) {
      router.push(href(`/account/login?next=${encodeURIComponent(window.location.pathname)}`));
      return;
    }
    startTransition(async () => {
      try {
        const next = await toggleFavoriteAction(productId);
        if (!next.signedIn) router.push(href(`/account/login?next=${encodeURIComponent(window.location.pathname)}`));
        setState(next);
      } catch {
        // Network error: keep the previous state.
      }
    });
  }

  const favorite = state?.favorite ?? false;
  const label = state && !state.signedIn ? t.me.favorites.signInToSave : favorite ? t.me.favorites.remove : t.me.favorites.add;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || (variant === "page" && state === null)}
      onPointerEnter={load}
      onFocus={load}
      aria-pressed={state?.signedIn ? favorite : undefined}
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
