import { ArrowRight } from "lucide-react";
import { Strokes } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t, href } = await getI18n();
  return (
    <div className="container-page flex flex-col items-start py-20 sm:py-28">
      <p className="relative font-display text-[clamp(7rem,28vw,15rem)] leading-[0.8] font-extrabold tracking-[-0.04em] text-accent-ink">
        404
        <Strokes className="absolute -top-4 -right-12 size-14 rotate-[100deg] text-ink sm:-right-16 sm:size-20" />
      </p>
      <h1 className="type-h2 mt-8 max-w-2xl">{t.notFound.title}</h1>
      <p className="mt-4 max-w-md text-muted sm:text-lg">{t.notFound.text}</p>
      <div className="mt-9 flex flex-col gap-3 min-[420px]:flex-row">
        <ButtonLink href={href("/menu")} size="lg">
          {t.common.viewMenu}
          <ArrowRight className="size-4.5" aria-hidden />
        </ButtonLink>
        <ButtonLink href={href("/")} size="lg" variant="outline">
          {t.notFound.home}
        </ButtonLink>
      </div>
    </div>
  );
}
