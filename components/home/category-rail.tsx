import Image from "next/image";
import Link from "next/link";
import type { CategorySummary } from "@/types/catalog";

export function CategoryRail({
  categories,
  counts,
}: {
  categories: CategorySummary[];
  counts: Record<string, number>;
}) {
  return (
    <section aria-labelledby="categorii-title" className="container-page pt-4 pb-10 sm:pb-14">
      <h2 id="categorii-title" className="sr-only">
        Categorii
      </h2>
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-8 lg:gap-4 lg:overflow-visible lg:px-0">
        {categories.map((c) => (
          <li key={c.id} className="w-[7.25rem] shrink-0 snap-start sm:w-32 lg:w-auto">
            <Link
              href={`/menu#${c.slug}`}
              className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white p-2.5 pb-3 text-center ring-1 ring-line/70 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
            >
              <span className="relative aspect-square w-full overflow-hidden rounded-xl bg-sand">
                {c.image && (
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 140px, 128px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </span>
              <span className="leading-tight">
                <span className="block font-display text-[0.95rem] font-bold text-ink">{c.name}</span>
                <span className="text-xs text-muted">{counts[c.slug] ?? 0} produse</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
