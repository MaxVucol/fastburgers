"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, ButtonLink } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t, href } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-start py-20 sm:py-28">
      <h1 className="type-h2 max-w-2xl">{t.error.title}</h1>
      <p className="mt-4 max-w-md text-muted sm:text-lg">{t.error.text}</p>
      <div className="mt-9 flex flex-col gap-3 min-[420px]:flex-row">
        <Button size="lg" onClick={reset}>
          {t.error.retry}
        </Button>
        <ButtonLink href={href("/")} size="lg" variant="outline">
          {t.common.home}
        </ButtonLink>
      </div>
    </div>
  );
}
