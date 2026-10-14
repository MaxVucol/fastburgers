import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { CartButton } from "./cart-button";
import { headerIcon, headerIconButton } from "./header-icon";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";

/**
 * Three layouts. Phones: menu · centred logo · theme and cart. Tablets (768–1023 px): menu and logo
 * on the left, languages and all icons on the right. Desktop: logo · navigation centred in the free
 * space · languages | theme, search, account, cart · order button. Sticky, near-black like the first
 * screen, with a hairline under it; the logo uses its own dark-background variant (`tone="dark"`),
 * the mark itself is unchanged.
 */
export async function Header() {
  const { t, href } = await getI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-line-dark bg-night text-on-dark">
      <div className="container-page grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center gap-2 md:grid-cols-[auto_auto_1fr] md:gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6 xl:gap-10">
        <div className="justify-self-start lg:hidden">
          <MobileMenu />
        </div>

        <Logo
          href={href("/")}
          label={t.header.homeLink}
          tone="dark"
          size="lg"
          className="justify-self-center md:justify-self-start"
        />

        <nav aria-label={t.nav.main} className="hidden justify-self-center lg:block">
          <NavLinks />
        </nav>

        <div className="flex items-center justify-self-end">
          <div className="hidden items-center md:flex">
            <LanguageSwitcher tone="dark" />
            <span className="mx-3 h-6 w-px bg-line-dark lg:mx-2.5 xl:mx-5" aria-hidden />
          </div>
          <div className="flex items-center gap-1 lg:gap-0.5 xl:gap-1.5">
            <ThemeToggle />
            <SearchDialog triggerClassName="hidden sm:grid" />
            {/* Account: the page itself shows sign-in or the account, so no session lookup here. */}
            <Link href={href("/account")} aria-label={t.me.link} title={t.me.link} className={`${headerIconButton} hidden sm:grid`}>
              <UserRound {...headerIcon} />
            </Link>
            <CartButton />
          </div>
          {/* Desktop only; the wrapper hides it (the button's own display class would win over `hidden`). */}
          <div className="ml-3 hidden lg:block xl:ml-6">
            <ButtonLink href={href("/menu")} size="sm" className="group h-11 gap-2.5 rounded-[var(--radius-sm)]! px-5 text-[0.9375rem]! xl:h-12 xl:px-7 xl:text-base!">
              {t.common.orderNow}
              <ArrowRight
                className="size-[1.125rem] transition-transform duration-[var(--duration-base)] group-hover:translate-x-0.5"
                aria-hidden
                strokeWidth={2.25}
              />
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
