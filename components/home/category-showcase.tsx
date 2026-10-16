"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ShowcasePhoto = { slug: string; name: string; description: string; src: string };

/**
 * The category list with its picture panel: the first rows are shown and the rest open with "show
 * more". On desktop the panel beside the list shows the picture of the row the pointer (or focus)
 * is on, crossfading from one to the next; it stays in view while the list is long. The rows are
 * rendered on the server and passed in, each marked with `data-cat` (its category slug).
 */
export function CategoryShowcase({
  first,
  rest,
  photos,
  moreLabel,
  lessLabel,
}: {
  first: React.ReactNode;
  rest: React.ReactNode;
  photos: ShowcasePhoto[];
  moreLabel: string;
  lessLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(photos[0]?.slug);
  // The first picture loads with the page; the rest once the browser is idle, so they never compete
  // with what is on screen but are there before the pointer reaches their row.
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    const start = () => setWarm(true);
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(start, { timeout: 4000 });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = window.setTimeout(start, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  function pick(target: EventTarget) {
    const row = (target as HTMLElement).closest<HTMLElement>("[data-cat]");
    if (row?.dataset.cat) setActive(row.dataset.cat);
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14">
      <div className="min-w-0" onMouseOver={(e) => pick(e.target)} onFocus={(e) => pick(e.target)}>
        <ol className="border-t-[1.5px] border-ink">
          {first}
          {open && rest}
        </ol>
        {rest && (
          <button
            type="button"
            onClick={() => {
              // Closing the list drops a picture that belongs to a row that is no longer there.
              if (open) setActive(photos[0]?.slug);
              setOpen((v) => !v);
            }}
            aria-expanded={open}
            className="mx-auto mt-8 flex h-12 items-center gap-2 rounded-full border-[1.5px] border-line px-7 text-[0.9375rem] font-semibold text-ink transition-colors duration-[var(--duration-fast)] hover:border-ink hover:bg-ink hover:text-paper"
          >
            {open ? lessLabel : moreLabel}
            <ChevronDown className={cn("size-4 transition-transform duration-[var(--duration-base)]", open && "rotate-180")} aria-hidden />
          </button>
        )}
      </div>

      {/* Desktop only (the pictures of the other sizes are not downloaded while it is hidden). */}
      <div
        className="relative hidden overflow-hidden rounded-[var(--radius-panel)] bg-gradient-to-br from-[#ffefe6] via-[#fddac5] to-[#f8c1a0] dark:from-graphite dark:via-graphite dark:to-graphite lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:block lg:h-[min(38rem,calc(100svh-9rem))] lg:self-start"
        aria-hidden
      >
        <span className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_50%_38%,rgb(255_255_255/0.09),transparent_62%)] dark:block" />
        {photos.map((photo, index) =>
          index === 0 || warm || photo.slug === active ? (
          <div
            key={photo.slug}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none",
              photo.slug === active ? "opacity-100" : "opacity-0",
            )}
          >
            <Image src={photo.src} alt="" fill sizes="(min-width: 1344px) 480px, 34vw" quality={70} className="object-contain px-8 pt-10 pb-32" />
            <span className="absolute inset-x-8 bottom-8 text-ink dark:text-on-dark">
              <span className="block font-display text-[2.25rem] leading-none font-black tracking-[-0.04em] uppercase">{photo.name}</span>
              {photo.description && <span className="mt-2 block max-w-sm text-sm text-muted dark:text-on-dark/75">{photo.description}</span>}
            </span>
          </div>
          ) : null,
        )}
        <span className="absolute inset-0 rounded-[inherit] ring-1 ring-ink/10 ring-inset dark:ring-on-dark/10" />
      </div>
    </div>
  );
}
