"use client";

import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import categoryIcons from "@/lib/category-icons.json";
import { cn } from "@/lib/utils";

export type CategoryTab = {
  key: string;
  href: string;
  label: string;
  /** Own picture instead of the category one (language flags). */
  icon?: React.ReactNode;
  /** Highlighted like the open category but without the line (the selected language). */
  selected?: boolean;
  /** Language of the link text, when it differs from the page. */
  lang?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Options shown in a card under the item on hover or focus (the other languages). */
  menu?: Omit<CategoryTab, "menu" | "selected">[];
  /** Extra classes on the item (e.g. hide it at some widths). */
  className?: string;
};

/** Small pictures shown above a category name: by category slug ("all" for the all-categories tab) with the file's pixel width; the height is 144. The list is built by scripts/make-category-icons.mjs. */
const CATEGORY_ICONS: Record<string, { src: string; width: number }> = categoryIcons;

/** Where the line was last drawn. A client navigation mounts a fresh nav, which starts from here and slides. */
let lastLine: { left: number; width: number } | null = null;

/**
 * Category links as plain text with one accent line under the hovered (or, if none, the current) item.
 * The line is a single element that slides between items instead of appearing under each one, and it
 * carries over from the previous page when a category is chosen.
 */
export function CategoryTabs({
  label,
  tabs,
  aside,
  activeKey,
  tone = "page",
}: {
  label: string;
  tabs: CategoryTab[];
  /** Shown to the right of the swipe row, outside it (the language). */
  aside?: CategoryTab;
  activeKey: string | null;
  /** "dark": on the always-dark site header; "page": on the page background (follows the theme). */
  tone?: "page" | "dark";
}) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  const target = hovered ?? activeKey;
  const targetRef = useRef(target);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Whether there is more of the row to swipe to on each side (shows a soft fade at that edge).
  const [more, setMore] = useState({ start: false, end: false });

  // Where the option card of an item goes: centred under it (kept on screen). Scrolling the page closes it.
  function openMenu(key: string, element: HTMLElement) {
    const box = element.getBoundingClientRect();
    const x = Math.min(Math.max(box.left + box.width / 2, 88), window.innerWidth - 88);
    setMenuAt({ x, y: box.bottom });
    setMenuKey(key);
  }

  function closeMenu() {
    setMenuAt(null);
    setMenuKey(null);
  }

  function measureMore() {
    const el = scrollerRef.current;
    if (!el) return;
    const start = el.scrollLeft > 2;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setMore((p) => (p.start === start && p.end === end ? p : { start, end }));
  }

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    measureMore();
    const observer = new ResizeObserver(measureMore);
    observer.observe(el);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  // The open category is brought into view (the row is longer than the screen).
  const scrolledOnce = useRef(false);
  useEffect(() => {
    const el = scrollerRef.current;
    const track = trackRef.current;
    if (!el || !track || !activeKey || el.scrollWidth <= el.clientWidth) return;
    const item = Array.from(track.children).find((c) => (c as HTMLElement).dataset.key === activeKey) as HTMLElement | undefined;
    if (!item) return;
    const itemBox = item.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    el.scrollBy({
      left: itemBox.left + itemBox.width / 2 - (box.left + box.width / 2),
      behavior: scrolledOnce.current ? "smooth" : "auto",
    });
    scrolledOnce.current = true;
  }, [activeKey]);

  // Swiping with a finger works natively; the mouse drags the row.
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || !scrollerRef.current) return;
    drag.current = { x: event.clientX, left: scrollerRef.current.scrollLeft, moved: false };
  }
  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = scrollerRef.current;
    if (!d || !el) return;
    const dx = event.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      setDragging(true);
      setHovered(null);
      setMenuKey(null);
      setMenuAt(null);
      el.setPointerCapture(event.pointerId);
    }
    if (d.moved) el.scrollLeft = d.left - dx;
  }
  function scrollByPage(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.7), behavior: "smooth" });
  }
  function endDrag() {
    if (drag.current?.moved) setDragging(false);
  }

  // The card also closes on a press anywhere outside it (a tap elsewhere on a touch screen) and on Escape.
  useEffect(() => {
    if (!menuAt) return;
    const close = () => {
      setMenuAt(null);
      setMenuKey(null);
    };
    const outside = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest?.("[data-menu-root]")) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("scroll", close, { passive: true, once: true });
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("scroll", close);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [menuAt]);

  // Moves the line under `target`. Without `animate` it jumps (first paint, resize, font load).
  function place(animate: boolean) {
    const track = trackRef.current;
    const line = lineRef.current;
    if (!track || !line) return;
    const item = Array.from(track.children).find((el) => (el as HTMLElement).dataset.key === targetRef.current) as HTMLElement | undefined;
    if (!item) {
      line.style.opacity = "0";
      return;
    }
    // Hidden (display: none, e.g. the other breakpoint's copy): nothing to measure; the resize observer places the line once it shows.
    if (item.offsetWidth === 0) {
      line.style.opacity = "0";
      return;
    }
    const next = { left: item.offsetLeft, width: item.offsetWidth };
    const show = (p: { left: number; width: number }) => {
      line.style.width = `${p.width}px`;
      line.style.transform = `translateX(${p.left}px)`;
    };
    const visible = line.style.opacity === "1";
    if (!placed.current || !animate || !visible) {
      line.style.transition = "none";
      show(!placed.current && lastLine && animate ? lastLine : next);
      line.style.opacity = !placed.current && lastLine && animate ? "1" : visible ? "1" : "0";
      void line.offsetWidth; // apply the jump before transitions come back
      line.style.transition = "";
    }
    placed.current = true;
    show(next);
    line.style.opacity = "1";
    lastLine = next;
  }

  useLayoutEffect(() => {
    targetRef.current = target;
    place(true);
  }, [target]);

  // Re-measure when the layout changes (window resize, web font loaded); the first callback is just the initial size.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let initial = true;
    const observer = new ResizeObserver(() => {
      if (initial) initial = false;
      else place(false);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const renderTab = (tab: CategoryTab) => {
    const face = (
      <>
        {tab.icon ? (
          <span className={cn("flex h-14 items-center transition-transform duration-300 sm:h-16", tab.key === target && "scale-105")}>{tab.icon}</span>
        ) : (
          CATEGORY_ICONS[tab.key] && (
            <SmartImage
              src={CATEGORY_ICONS[tab.key].src}
              alt=""
              width={CATEGORY_ICONS[tab.key].width}
              height={144}
              sizes="96px"
              className={cn("h-14 w-auto object-contain transition-transform duration-300 sm:h-16", tab.key === target && "scale-105")}
            />
          )
        )}
        <span className="flex h-10 items-center">{tab.label}</span>
      </>
    );
    const linkClass = cn(
      "flex shrink-0 flex-col items-center justify-end gap-1 text-sm font-semibold whitespace-nowrap transition-colors duration-[var(--duration-fast)]",
      tab.key === target || tab.selected ? (tone === "dark" ? "text-on-dark" : "text-ink") : tone === "dark" ? "text-muted-on-dark" : "text-muted",
      tab.menu ? undefined : tab.className,
    );
    const current = tab.key === activeKey ? "page" : tab.selected ? "true" : undefined;

    if (!tab.menu) {
      return (
        <Link
          key={tab.key}
          href={tab.href}
          data-key={tab.key}
          hrefLang={tab.lang}
          lang={tab.lang}
          onClick={tab.onClick}
          aria-current={current}
          onMouseEnter={() => setHovered(tab.key)}
          onFocus={() => setHovered(tab.key)}
          onBlur={() => setHovered(null)}
          className={linkClass}
        >
          {face}
        </Link>
      );
    }

    // An item with a card of options (the language): the card opens under it on hover or focus.
    // It is positioned from the item's rectangle (fixed) so the scrolling row does not clip it.
    const open = menuKey === tab.key && menuAt !== null;
    return (
      <div
        key={tab.key}
        data-key={tab.key}
        data-menu-root
        className={cn("shrink-0", tab.className)}
        // Hover is for a mouse only (a tap on a touch screen also sends "enter", and would open and close the card at once);
        // moving the pointer off the item and its card closes it.
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") openMenu(tab.key, e.currentTarget);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") closeMenu();
        }}
        // Keyboard focus opens it; a mouse or finger press focuses the item too, but that is handled by the click below.
        onFocus={(e) => {
          if ((e.target as HTMLElement).matches(":focus-visible")) openMenu(tab.key, e.currentTarget);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) closeMenu();
        }}
      >
        <Link
          href={tab.href}
          hrefLang={tab.lang}
          lang={tab.lang}
          // The selected language is already the current one: a click or tap opens the other languages instead, and closes them again.
          onClick={(e) => {
            e.preventDefault();
            if (open) closeMenu();
            else openMenu(tab.key, e.currentTarget.parentElement as HTMLElement);
          }}
          aria-current={current}
          aria-haspopup="true" aria-expanded={open} className={linkClass}>
          {face}
        </Link>
        {open && (
          <div className="fixed z-50 -translate-x-1/2 pt-2" style={{ left: menuAt.x, top: menuAt.y }}>
            <ul className="min-w-36 overflow-hidden rounded-[var(--radius-card)] border border-line-dark bg-graphite p-1.5 shadow-[var(--shadow-lift)]">
              {tab.menu.map((option) => (
                <li key={option.key}>
                  <Link
                    href={option.href}
                    hrefLang={option.lang}
                    lang={option.lang}
                    onClick={(e) => {
                      closeMenu();
                      option.onClick?.(e);
                    }}
                    className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-semibold text-on-dark/85 transition-colors duration-[var(--duration-fast)] hover:bg-on-dark/[0.08] hover:text-on-dark"
                  >
                    {option.icon}
                    {option.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const arrowButton = (side: "start" | "end") => (
    <div
      key={side}
      className={cn(
        "pointer-events-none absolute inset-y-0 z-10 flex w-16 transition-opacity duration-200",
        side === "start"
          ? "left-0 justify-start bg-gradient-to-r max-sm:-left-[var(--gutter)] max-sm:w-[calc(4rem+var(--gutter))] max-sm:pl-[var(--gutter)]"
          : cn("right-0 justify-end bg-gradient-to-l", !aside && "max-sm:-right-[var(--gutter)] max-sm:w-[calc(4rem+var(--gutter))] max-sm:pr-[var(--gutter)]"),
        tone === "dark" ? "from-night via-night/80" : "from-cream via-cream/80",
        "to-transparent",
        more[side] ? "opacity-100" : "opacity-0",
      )}
    >
      <button
        type="button"
        tabIndex={more[side] ? 0 : -1}
        aria-hidden={!more[side]}
        aria-label={side === "start" ? t.menu.scrollBack : t.menu.scrollForward}
        onClick={() => scrollByPage(side === "start" ? -1 : 1)}
        className={cn(
          "mt-3 grid size-8 place-items-center rounded-full border transition-colors duration-[var(--duration-fast)] sm:mt-4",
          more[side] ? "pointer-events-auto" : "pointer-events-none",
          tone === "dark"
            ? "border-line-dark bg-graphite text-on-dark hover:border-accent hover:bg-accent hover:text-on-accent"
            : "border-line bg-paper text-ink hover:bg-ink hover:text-paper",
        )}
      >
        {side === "start" ? <ChevronLeft className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
      </button>
    </div>
  );

  return (
    <nav aria-label={label} className="flex items-end gap-3 sm:gap-5">
      <div className="relative min-w-0 flex-1">
        <div
          ref={scrollerRef}
          onScroll={measureMore}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDragStart={(e) => e.preventDefault()}
          // A drag that moved the row must not also follow the link it ended on.
          onClickCapture={(e) => {
            if (drag.current?.moved) {
              e.preventDefault();
              e.stopPropagation();
            }
            drag.current = null;
          }}
          className={cn(
            "no-scrollbar -ml-[var(--gutter)] overflow-x-auto pl-[var(--gutter)] sm:ml-0 sm:pl-0",
            !aside && "-mr-[var(--gutter)] pr-[var(--gutter)] sm:mr-0 sm:pr-0",
            (more.start || more.end) && "cursor-grab",
            dragging && "cursor-grabbing select-none",
          )}
        >
          <div ref={trackRef} className="relative flex w-max min-w-full items-end justify-between gap-6 sm:gap-8" onMouseLeave={() => setHovered(null)}>
            {tabs.map(renderTab)}
            <span
              ref={lineRef}
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-accent opacity-0 transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
            />
          </div>
        </div>
        {/* Arrows where the row continues; the language stays outside the swipe row, always in view. */}
        {(["start", "end"] as const).map(arrowButton)}
      </div>
      {aside && (
        <div className={cn("shrink-0 self-stretch border-l pl-3 sm:pl-5", tone === "dark" ? "border-line-dark" : "border-line", aside.className)}>
          <div className="flex h-full items-end">{renderTab(aside)}</div>
        </div>
      )}
    </nav>
  );
}
