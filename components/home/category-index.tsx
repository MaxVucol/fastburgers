import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { CategorySummary } from "@/types/catalog";

/** Photo tiles for the categories: a swipe rail on phones, 4 columns on tablets, one row on wide screens. */
export async function CategoryIndex({
  categories,
  counts,
}: {
  categories: CategorySummary[];
  counts: Record<string, number>;
}) {
  const { locale, t, href } = await getI18n();

  return (
    <section aria-labelledby="categorii-title" className="container-page section-y">
      <SectionHeading
        id="categorii-title"
        eyebrow={t.categories.eyebrow}
        title={t.categories.title}
        lead={t.categories.lead}
        action={{ href: href("/menu"), label: t.categories.viewAll }}
      />
      <ul className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-3 overflow-x-auto px-[var(--gutter)] pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-8 xl:gap-3">
        {categories.map((c) => (
          <li key={c.id} className="w-[38vw] max-w-[11.5rem] shrink-0 snap-start md:w-auto md:max-w-none">
            <Link
              href={href(`/categorii/${c.slug}`)}
              className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-graphite transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out-brand)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] md:aspect-[5/4] xl:aspect-[4/5]"
            >
              {c.image && (
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 160px, (min-width: 768px) 24vw, 38vw"
                  className="object-cover transition-transform duration-500 ease-[var(--ease-out-brand)] group-hover:scale-[1.06]"
                />
              )}
              {/* A short scrim only where the label sits, so the photo stays clean. */}
              <span className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent" aria-hidden />
              <span className="absolute inset-x-0 bottom-0 p-3 text-on-dark sm:p-3.5">
                <span className="block font-display text-[1.0625rem] leading-tight font-bold tracking-[-0.01em] sm:text-lg">
                  {c.name}
                </span>
                <span className="mt-0.5 block text-xs text-on-dark/80">
                  {plural(locale, counts[c.slug] ?? 0, t.categories.count)}
                </span>
              </span>
              {/* Orange hairline that grows on hover — the only extra flourish. */}
              <span
                className="absolute bottom-0 left-0 h-[3px] w-0 bg-accent transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-out-brand)] group-hover:w-full"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
