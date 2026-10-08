"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-sand shadow-[var(--shadow-soft)]">
        <Image
          key={current}
          src={current}
          alt={images.length > 1 ? `${name} — imaginea ${active + 1} din ${images.length}` : name}
          fill
          preload={active === 0}
          sizes="(min-width: 1280px) 680px, (min-width: 1024px) 55vw, 100vw"
          className="animate-fade-up object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3" role="group" aria-label="Galerie imagini">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Afișează imaginea ${i + 1}`}
              aria-pressed={i === active}
              className={cn(
                "relative aspect-[4/3] w-24 overflow-hidden rounded-xl bg-sand ring-2 transition sm:w-28",
                i === active ? "ring-accent" : "ring-transparent opacity-75 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
