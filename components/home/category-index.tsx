import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { CategorySummary } from "@/types/catalog";

/** Photo tiles for the eight categories: a swipe rail on phones, a 4-column grid above. */
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
        title={t.categories.title}
        lead={t.categories.lead}
        action={{ href: href("/menu"), label: t.categories.viewAll }}
      />
      <ul className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-3 overflow-x-auto px-[var(--gutter)] pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
        {categories.map((c) => (
          <li key={c.id} className="w-[42vw] max-w-[13rem] shrink-0 snap-start md:w-auto md:max-w-none">
            <Link
              href={href(`/categorii/${c.slug}`)}
              className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-graphite md:aspect-[5/4]"
            >
              {c.image && (
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 300px, (min-width: 768px) 24vw, 42vw"
                  className="object-cover transition-transform duration-500 ease-[var(--ease-out-brand)] group-hover:scale-[1.06]"
                />
              )}
              {/* A short scrim only where the label sits, so the photo stays clean. */}
              <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent" aria-hidden />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 text-on-dark sm:p-4">
                <span className="min-w-0">
                  <span className="block font-display text-xl leading-none font-semibold uppercase sm:text-2xl">
                    {c.name}
                  </span>
                  <span className="mt-1.5 block text-xs text-on-dark/80">
                    {plural(locale, counts[c.slug] ?? 0, t.categories.count)}
                  </span>
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream text-ink transition-colors duration-[var(--duration-fast)] group-hover:bg-accent">
                  <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
