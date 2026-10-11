import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

/**
 * Closing band: one short handwritten line, the order call set as large as the first screen's
 * slogan (the whole phrase is the link to the menu) and the phone number for ordering by call.
 * Warm cream-to-peach light, so it reads as the poster's sign-off before the dark footer.
 * The last word is in the deep orange (accent-ink): large text, ≥4:1 on this background.
 */
export async function OrderCta() {
  const { t, href } = await getI18n();
  const words = t.cta.primary.split(" ");
  const last = words.length > 1 ? words.pop() : null;

  return (
    <section
      aria-labelledby="cta-title"
      className="bg-[linear-gradient(100deg,var(--color-cream)_25%,var(--color-peach))] text-ink"
    >
      <div className="container-page grid items-center gap-x-10 gap-y-5 py-12 sm:py-14 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:py-16">
        <p className="type-script -rotate-3 text-[1.75rem] text-accent-ink sm:text-[2.25rem]">{t.cta.note}</p>
        <h2 id="cta-title">
          <Link
            href={href("/menu")}
            className="group font-display text-[clamp(2.25rem,8vw,5.5rem)] leading-[0.9] font-black tracking-[-0.045em] uppercase"
          >
            {words.join(" ")}
            {last && <span className="text-accent-ink"> {last}</span>}
            {/* Inline, so it stays on the last line however the phrase wraps. */}
            <span className="ml-[0.25em] inline-grid size-[0.62em] place-items-center rounded-full bg-accent align-[-0.06em] text-on-accent transition-transform duration-[var(--duration-base)] group-hover:translate-x-1">
              <ArrowRight className="size-[0.4em]" aria-hidden strokeWidth={2.4} />
            </span>
          </Link>
        </h2>
        <a
          href={siteConfig.phoneHref}
          className="inline-flex items-center gap-3 justify-self-start text-sm font-semibold lg:justify-self-end"
        >
          <span className="grid size-11 place-items-center rounded-full border-[1.5px] border-ink/70">
            <Phone className="size-4.5" aria-hidden />
          </span>
          <span>
            <span className="block text-muted">{t.cta.call}</span>
            <span className="text-base tabular-nums">{siteConfig.phone}</span>
          </span>
        </a>
      </div>
    </section>
  );
}
