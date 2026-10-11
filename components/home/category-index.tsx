import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { CategorySummary } from "@/types/catalog";

/**
 * The menu as a typographic index: numbered rows with the category name set large, its
 * description and item count, on cream between the dark blocks. Phones and tablets: a small
 * photo opens each row. Desktop: one big photo panel right of the list shows the hovered or focused
 * category (the first one while none is), and that row is marked as the active one (plain CSS, see
 * `.cat-index` in globals.css); each row carries its photo so the panel never needs JavaScript.
 */
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
      <div className="cat-index relative lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14">
        <ol className="border-t-[1.5px] border-ink">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link
                href={href(`/categorii/${c.slug}`)}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-line py-2.5 transition-colors sm:gap-x-6 sm:py-3.5 lg:grid-cols-[2.5rem_minmax(0,1fr)_auto] lg:py-4"
              >
                <span className="relative size-14 overflow-hidden rounded-[var(--radius-sm)] bg-graphite sm:size-16 lg:hidden">
                  {c.image && <Image src={c.image} alt="" fill sizes="64px" className="object-cover" />}
                </span>
                <span className="hidden font-display text-sm font-bold text-accent-ink tabular-nums lg:block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="cat-name block font-display text-[1.5rem] leading-none font-extrabold tracking-[-0.035em] text-ink transition-[color,translate] duration-[var(--duration-base)] ease-[var(--ease-out-brand)] group-hover:text-accent-ink sm:text-[2rem] lg:text-[2.5rem] lg:group-hover:translate-x-1.5 xl:text-[2.75rem]">
                    {c.name}
                  </span>
                  <span className="mt-1.5 block truncate text-[0.8125rem] text-muted sm:text-sm">
                    <span className="font-semibold text-ink-soft">{plural(locale, counts[c.slug] ?? 0, t.categories.count)}</span>
                    <span className="hidden md:inline"> · {c.description}</span>
                  </span>
                </span>
                <span className="cat-arrow grid size-10 place-items-center rounded-full border-[1.5px] border-line text-ink transition-colors duration-[var(--duration-base)] group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent sm:size-11">
                  <ArrowRight className="size-4.5" aria-hidden />
                </span>
              </Link>
              {c.image && (
                <span className="cat-photo pointer-events-none absolute inset-y-0 right-0 hidden w-[calc((100%-3.5rem)*0.9/1.9)] overflow-hidden rounded-[var(--radius-panel)] transition-opacity duration-[var(--duration-slow)] lg:block">
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 1344px) 560px, 40vw"
                    className="object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night/90 to-transparent" />
                  {/* Dark theme: a hairline so the panel's edge stays visible on the near-black page. */}
                  <span className="absolute inset-0 hidden rounded-[inherit] ring-1 ring-on-dark/10 ring-inset dark:block" />
                  <span className="absolute inset-x-7 bottom-7 text-on-dark">
                    <span className="block font-display text-[2.5rem] leading-none font-black tracking-[-0.04em] uppercase">{c.name}</span>
                    <span className="mt-2 block max-w-sm text-sm text-on-dark/80">{c.description}</span>
                  </span>
                </span>
              )}
            </li>
          ))}
        </ol>
        {/* The panel the row photos are positioned on (desktop only). */}
        <div className="hidden overflow-hidden rounded-[var(--radius-panel)] bg-graphite lg:block" aria-hidden />
      </div>
    </section>
  );
}
