import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import categoryIcons from "@/lib/category-icons.json";
import { plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { CategorySummary } from "@/types/catalog";
import { CategoryShowcase, type ShowcasePhoto } from "./category-showcase";

/** Rows shown before "show more". */
const VISIBLE_ROWS = 6;
/** For a category that has no picture of its own. */
const FALLBACK_PHOTO = "/images/categories/burgeri.webp";
const icons: Record<string, { src: string; width: number; showcase?: string }> = categoryIcons;

/**
 * The menu as a typographic index: numbered rows with the category name set large, its
 * description and item count, on cream between the dark blocks. The first rows are shown and the
 * rest open with "show more". Phones and tablets: the category picture opens each row. Desktop: a
 * picture panel beside the list shows the picture of the row the pointer is on.
 */
export async function CategoryIndex({
  categories,
  counts,
}: {
  categories: CategorySummary[];
  counts: Record<string, number>;
}) {
  const { locale, t, href } = await getI18n();

  const row = (c: CategorySummary, i: number) => {
    const icon = icons[c.slug];
    return (
      <li key={c.id} data-cat={c.slug}>
        <Link
          href={href(`/categorii/${c.slug}`)}
          className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-line py-2.5 transition-colors sm:gap-x-6 sm:py-3.5 lg:grid-cols-[2.5rem_minmax(0,1fr)_auto] lg:py-4"
        >
          <span className="relative size-14 overflow-hidden rounded-[var(--radius-sm)] bg-graphite sm:size-16 lg:hidden">
            {icon ? (
              <Image src={icon.src} alt="" fill sizes="64px" className="object-contain p-1" />
            ) : (
              c.image && <Image src={c.image} alt="" fill sizes="64px" className="object-cover" />
            )}
          </span>
          <span className="hidden font-display text-sm font-bold text-accent-ink tabular-nums lg:block">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[1.5rem] leading-none font-extrabold tracking-[-0.035em] text-ink transition-[color,translate] duration-[var(--duration-base)] ease-[var(--ease-out-brand)] group-hover:text-accent-ink sm:text-[2rem] lg:text-[2.5rem] lg:group-hover:translate-x-1.5 xl:text-[2.75rem]">
              {c.name}
            </span>
            <span className="mt-1.5 block truncate text-[0.8125rem] text-muted sm:text-sm">
              <span className="font-semibold text-ink-soft">{plural(locale, counts[c.slug] ?? 0, t.categories.count)}</span>
              {c.description && <span className="hidden md:inline"> · {c.description}</span>}
            </span>
          </span>
          <span className="grid size-10 place-items-center rounded-full border-[1.5px] border-line text-ink transition-colors duration-[var(--duration-base)] group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent sm:size-11">
            <ArrowRight className="size-4.5" aria-hidden />
          </span>
        </Link>
      </li>
    );
  };

  const rows = categories.map(row);
  const photos: ShowcasePhoto[] = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    src: icons[c.slug]?.showcase ?? c.image ?? FALLBACK_PHOTO,
  }));

  return (
    <section aria-labelledby="categorii-title" className="container-page section-y">
      <SectionHeading
        id="categorii-title"
        eyebrow={t.categories.eyebrow}
        title={t.categories.title}
        lead={t.categories.lead}
        action={{ href: href("/menu"), label: t.categories.viewAll }}
      />
      <CategoryShowcase
        first={rows.slice(0, VISIBLE_ROWS)}
        rest={rows.length > VISIBLE_ROWS ? rows.slice(VISIBLE_ROWS) : null}
        photos={photos}
        moreLabel={t.categories.showMore}
        lessLabel={t.categories.showLess}
      />
    </section>
  );
}
