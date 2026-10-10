import { ArrowRight, Phone } from "lucide-react";
import { Strokes } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

/** Closing band in flame orange — the only full orange surface on the site. */
export async function OrderCta() {
  const { t, href } = await getI18n();
  const [lineOne, lineTwo] = t.cta.titleLines;

  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-accent text-ink">
      <Strokes className="absolute top-8 right-[6%] hidden size-24 rotate-[100deg] text-ink/85 md:block" />
      <div className="container-page grid items-end gap-8 py-16 sm:py-20 lg:grid-cols-[1fr_auto] lg:py-24">
        <div>
          <h2 id="cta-title" className="type-h1">
            <span className="block">{lineOne}</span>
            <span className="block">{lineTwo}</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink">{t.cta.text}</p>
        </div>
        <div className="flex flex-col gap-3 min-[420px]:flex-row lg:flex-col xl:flex-row">
          <ButtonLink href={href("/menu")} size="lg" variant="dark">
            {t.cta.primary}
            <ArrowRight className="size-4.5" aria-hidden />
          </ButtonLink>
          <ButtonLink href={siteConfig.phoneHref} size="lg" variant="outline">
            <Phone className="size-4.5" aria-hidden />
            {siteConfig.phone}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
