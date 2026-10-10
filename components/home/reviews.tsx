import { Stars } from "@/components/ui/stars";
import { formatDate, formatNumber } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/catalog";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Real reviews from the database. Layout: the average score as a large figure on the left,
 * quotes flowing in columns on the right — no carousel, nothing hidden.
 */
export async function Reviews({ reviews }: { reviews: Review[] }) {
  const { locale, t } = await getI18n();
  if (reviews.length === 0) return null;
  const average = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <section aria-labelledby="reviews-title" className="bg-sand">
      <div className="container-page section-y grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
          <h2 id="reviews-title" className="type-h2">
            {t.reviews.title}
          </h2>
          <p className="mt-6 flex items-end gap-3">
            <span className="font-display text-[5rem] leading-[0.8] font-extrabold tracking-[-0.04em] tabular-nums">
              {formatNumber(average, locale)}
            </span>
            <span className="pb-1">
              <Stars rating={Math.round(average)} label={fill(t.reviews.stars, { rating: formatNumber(average, locale) })} />
              <span className="mt-1 block text-sm text-muted">/ 5</span>
            </span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            {fill(t.reviews.lead, { average: formatNumber(average, locale) })}
          </p>
          {t.reviews.originalLanguage && (
            <p className="mt-2 max-w-xs text-xs text-muted">{t.reviews.originalLanguage}</p>
          )}
        </div>

        <ul className="columns-1 gap-4 md:columns-2 [&>li]:mb-4 [&>li]:break-inside-avoid">
          {reviews.map((review, i) => (
            <li key={review.id} className="reveal">
              <figure
                className={cn(
                  "rounded-[var(--radius-card)] p-6 sm:p-7",
                  i % 3 === 0 ? "bg-ink text-on-dark" : "border border-line bg-paper",
                )}
              >
                <Stars
                  rating={review.rating}
                  label={fill(t.reviews.stars, { rating: review.rating })}
                />
                <blockquote lang="ro" className={cn("mt-4 text-[1.0625rem] leading-relaxed", i % 3 === 0 ? "text-on-dark" : "text-ink-soft")}>
                  “{review.text}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full text-sm font-bold",
                      i % 3 === 0 ? "bg-accent text-ink" : "bg-sand text-ink",
                    )}
                    aria-hidden
                  >
                    {initials(review.name)}
                  </span>
                  <span>
                    <span className="block font-semibold">{review.name}</span>
                    <time
                      dateTime={review.createdAt.toISOString()}
                      className={cn("text-xs", i % 3 === 0 ? "text-muted-on-dark" : "text-muted")}
                    >
                      {formatDate(review.createdAt, locale)}
                    </time>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
