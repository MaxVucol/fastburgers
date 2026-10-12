import Link from "next/link";
import { ArrowRight, CircleUserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { CartButton } from "./cart-button";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";

/**
 * Phones: menu · centred logo · cart. Desktop: logo · centred navigation · languages,
 * theme switch, search, cart and the order button (phones keep the theme switch beside the cart). Sticky, near-black like the first screen; the logo uses
 * its own dark-background variant (`tone="dark"`), the mark itself is unchanged.
 */
export async function Header() {
  const { t, href } = await getI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-line-dark bg-night text-on-dark">
      <div className="container-page grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center gap-2 lg:grid-cols-[auto_1fr_auto] lg:gap-6">
        <div className="justify-self-start lg:hidden">
          <MobileMenu />
        </div>

        <Logo href={href("/")} label={t.header.homeLink} tone="dark" className="justify-self-center lg:justify-self-start" />

        <nav aria-label={t.nav.main} className="hidden justify-self-center lg:block">
          <NavLinks />
        </nav>

        <div className="flex items-center justify-self-end gap-0.5 sm:gap-1">
          <div className="mr-1 hidden items-center gap-2 md:flex">
            <LanguageSwitcher tone="dark" />
            <span className="h-6 w-px bg-line-dark" aria-hidden />
          </div>
          <ThemeToggle />
          <SearchDialog triggerClassName="hidden sm:grid" />
          {/* Account: the page itself shows sign-in or the account, so no session lookup here. */}
          <Link
            href={href("/account")}
            aria-label={t.me.link}
            title={t.me.link}
            className="hidden size-11 place-items-center rounded-full text-on-dark transition-colors duration-[var(--duration-fast)] hover:bg-graphite-soft sm:grid"
          >
            <CircleUserRound className="size-[1.375rem]" aria-hidden strokeWidth={1.8} />
          </Link>
          <CartButton />
          {/* Desktop only; the wrapper hides it (the button's own display class would win over `hidden`). */}
          <div className="ml-2 hidden lg:block">
            <ButtonLink href={href("/menu")} size="sm" className="h-10 px-5">
              {t.common.orderNow}
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
