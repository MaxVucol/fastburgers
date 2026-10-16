"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

/** How far down the page must be before the button appears. */
const SHOW_AFTER = 600;

/**
 * A round orange button in the bottom right corner that brings the page back to the top. It slides
 * and fades in once the visitor has scrolled down, and out again near the top.
 */
export function BackToTop() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > SHOW_AFTER);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label={t.common.backToTop}
      title={t.common.backToTop}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => window.scrollTo({ top: 0, left: 0 })}
      className={cn(
        "fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-12 place-items-center rounded-full bg-accent text-on-accent shadow-[0_6px_18px_-4px_rgb(255_107_46/0.55),0_2px_6px_rgb(0_0_0/0.2)] transition-[opacity,translate,background-color,scale] duration-300 ease-out hover:bg-accent-hover active:scale-95 motion-reduce:transition-none sm:right-6 sm:bottom-6 sm:size-14",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <ArrowUp className="size-5 sm:size-6" aria-hidden strokeWidth={2.4} />
    </button>
  );
}
