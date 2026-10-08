import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stars } from "@/components/ui/stars";
import { formatDate } from "@/lib/format";
import type { Review } from "@/types/catalog";

const AVATAR_TONES = ["bg-accent-soft text-accent", "bg-mustard-soft text-[#8a5a00]", "bg-herb-soft text-herb"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const average = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <section aria-labelledby="reviews-title" className="container-page py-14 sm:py-20">
      <SectionHeading
        id="reviews-title"
        eyebrow="Recenzii"
        title="Ce spun clienții noștri"
        description={`Nota medie ${average.toLocaleString("ro-RO", { maximumFractionDigits: 1 })} din 5, din recenzii verificate după livrare.`}
      />
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, i) => (
          <li key={review.id} className="reveal">
            <figure className="flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-line/70 sm:p-6">
              <div className="flex items-center justify-between">
                <Stars rating={review.rating} />
                <Quote className="size-6 text-oat" aria-hidden />
              </div>
              <blockquote className="mt-4 flex-1 leading-relaxed text-ink-soft">„{review.text}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  className={`grid size-10 place-items-center rounded-full text-sm font-bold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
                  aria-hidden
                >
                  {initials(review.name)}
                </span>
                <span>
                  <span className="block font-semibold">{review.name}</span>
                  <time dateTime={review.createdAt.toISOString()} className="text-xs text-muted">
                    {formatDate(review.createdAt)}
                  </time>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
