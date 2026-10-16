"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const EXPANDED_HEADER_ID = "header-expanded";

/**
 * The compact header bar. Phones and tablets: sticky, always visible. Desktop: the tall header
 * (top bar, centred logo, category row) is shown at scroll 0, and this bar slides in from the top
 * once that block has scrolled out of view.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const tall = document.getElementById(EXPANDED_HEADER_ID);
    if (!tall) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), { threshold: 0 });
    observer.observe(tall);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "site-header sticky top-0 z-40 border-b border-line-dark bg-night text-on-dark",
        "lg:fixed lg:inset-x-0 lg:transition-[transform,visibility] lg:duration-300 lg:ease-[var(--ease-out-brand)] motion-reduce:lg:transition-none",
        compact ? "lg:visible lg:translate-y-0" : "lg:invisible lg:-translate-y-full",
      )}
    >
      {children}
    </header>
  );
}
