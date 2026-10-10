"use client";

import Image from "next/image";
import { useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { fill } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)] bg-sand">
        <Image
          key={current}
          src={current}
          alt={images.length > 1 ? fill(t.product.imageOf, { name, index: active + 1, count: images.length }) : name}
          fill
          preload={active === 0}
          sizes="(min-width: 1344px) 700px, (min-width: 1024px) 52vw, 100vw"
          className="animate-fade-in object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3" role="group" aria-label={t.product.gallery}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={fill(t.product.showImage, { index: i + 1 })}
              aria-pressed={i === active}
              className={cn(
                "relative aspect-[4/3] w-24 overflow-hidden rounded-[var(--radius-sm)] bg-sand transition-opacity sm:w-28",
                i === active ? "ring-2 ring-ink ring-offset-2 ring-offset-cream" : "opacity-70 hover:opacity-100",
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
