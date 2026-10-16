"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export type HeroSlide = { src: string; alt: string; href: string };

const INTERVAL = 6500;
const SWIPE_DISTANCE = 45;

/**
 * The home page's banner slideshow: full-width pictures that slide, round arrows, dots below. It
 * advances by itself, stops while the pointer or focus is on it, while the tab is hidden and for
 * visitors who ask for less motion, and can be swiped (touch) or dragged (mouse). Each slide is a link.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const start = useRef<{ x: number; moved: boolean } | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reduced || count < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, INTERVAL);
    return () => window.clearInterval(timer);
  }, [paused, reduced, count, index]);

  if (count === 0) return null;

  // Round outlined arrows, outside the picture: at the sides on wide screens, beside the dots below
  // it on phones and tablets.
  const arrow = (dir: "prev" | "next", className: string) => (
    <button
      type="button"
      aria-label={dir === "prev" ? t.hero.prev : t.hero.next}
      onClick={() => go(index + (dir === "prev" ? -1 : 1))}
      className={cn(
        "size-10 place-items-center rounded-full border-[1.5px] border-accent text-accent-ink transition-colors duration-[var(--duration-fast)] hover:bg-accent hover:text-on-accent lg:size-12",
        className,
      )}
    >
      {dir === "prev" ? <ChevronLeft className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
    </button>
  );

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t.hero.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
    >
      <div className="lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
        {count > 1 && arrow("prev", "hidden lg:grid")}
        <div
          className="relative aspect-[1930/815] touch-pan-y overflow-hidden rounded-[var(--radius-panel)] bg-graphite"
          onPointerDown={(e) => {
            start.current = { x: e.clientX, moved: false };
          }}
          onPointerMove={(e) => {
            if (start.current && Math.abs(e.clientX - start.current.x) > 6) start.current.moved = true;
          }}
          onPointerUp={(e) => {
            const s = start.current;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > SWIPE_DISTANCE) go(index + (dx < 0 ? 1 : -1));
          }}
          onPointerCancel={() => (start.current = null)}
          // A swipe must not also follow the link it ended on.
          onClickCapture={(e) => {
            if (start.current?.moved) {
              e.preventDefault();
              e.stopPropagation();
            }
            start.current = null;
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          <div
            className="flex h-full transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide, i) => (
              <div
                key={slide.src}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${count}`}
                aria-hidden={i !== index}
                className="relative h-full w-full shrink-0"
              >
                <Link href={slide.href} tabIndex={i === index ? 0 : -1} className="absolute inset-0 block">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    {...(i === 0 ? { preload: true, fetchPriority: "high" as const } : { loading: "lazy" as const })}
                    quality={80}
                    sizes="(min-width: 1344px) 1312px, 100vw"
                    className="object-cover"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {count > 1 && arrow("next", "hidden lg:grid")}
      </div>

      {count > 1 && (
        <div className="mt-2 flex items-center justify-center gap-0" role="group" aria-label={t.hero.carousel}>
          {arrow("prev", "mr-2 grid lg:hidden")}
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={fill(t.hero.goTo, { n: i + 1 })}
              aria-current={i === index}
              onClick={() => go(i)}
              className="group grid h-8 place-items-center px-2"
            >
              <span
                aria-hidden
                className={cn(
                  "block h-2.5 rounded-full border-[1.5px] transition-[width,background-color,border-color] duration-300",
                  i === index ? "w-7 border-accent bg-accent" : "w-2.5 border-ink-soft/70 group-hover:border-ink",
                )}
              />
            </button>
          ))}
          {arrow("next", "ml-2 grid lg:hidden")}
        </div>
      )}
    </div>
  );
}
