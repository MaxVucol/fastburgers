import { Spark } from "@/components/ui/brand";
import { getI18n } from "@/lib/i18n/server";
import { LanguageSwitcher } from "./language-switcher";

/** Thin graphite strip above the header: the two brand promises + language switch. */
export async function TopBar() {
  const { t } = await getI18n();
  const [first, second] = t.topbar.items;

  return (
    <div className="bg-ink text-on-dark">
      <div className="container-page grid h-[var(--topbar-h)] grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <span className="hidden sm:block" aria-hidden />
        <p className="flex min-w-0 items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase min-[380px]:tracking-[0.16em] sm:gap-2.5">
          <Spark className="size-3 shrink-0 text-accent" />
          <span className="hidden sm:inline">{first}</span>
          <span className="hidden size-1 rounded-full bg-on-dark/50 sm:inline-block" aria-hidden />
          <span className="truncate">{second}</span>
          <Spark className="hidden size-3 shrink-0 text-accent sm:block" />
        </p>
        <div className="justify-self-end">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
