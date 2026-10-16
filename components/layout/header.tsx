import Link from "next/link";
import { ArrowRight, Phone, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { localizeCategory } from "@/lib/i18n/catalog";
import { fill } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { getCategories } from "@/services/catalog";
import { CartButton } from "./cart-button";
import { headerIcon, headerIconButton } from "./header-icon";
import { HeaderCategories } from "./header-categories";
import { EXPANDED_HEADER_ID, HeaderShell } from "./header-shell";
import { HideOnMenu } from "./hide-on-menu";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { SearchDialog } from "./search-dialog";
import { configuredSocials } from "./social-links";
import { ThemeToggle } from "./theme-toggle";

/**
 * Desktop (1024 px and up), at scroll 0: a tall header in three tiers — top bar (phone, navigation,
 * languages), the centred logo between social profiles and the icons, and a row of categories with
 * their pictures. Once it has scrolled away, the compact bar slides in from the top.
 *
 * Phones and tablets keep the compact bar (sticky) — menu · centred logo · theme and cart on phones,
 * menu and logo on the left and languages and icons on the right on tablets — with the category row
 * underneath. The bar is near-black like the first screen, with a hairline under it; the logo uses
 * its own dark-background variant (`tone="dark"`), the mark itself is unchanged.
 */
export async function Header() {
  const [{ locale, t, href }, categories] = await Promise.all([getI18n(), getCategories()]);
  const categoryLinks = categories.map((c) => localizeCategory(c, locale));
  const socials = configuredSocials();

  return (
    <>
      <div id={EXPANDED_HEADER_ID} className="site-header hidden border-b border-line-dark bg-night text-on-dark lg:block">
        <div className="border-b border-line-dark">
          <div className="container-page flex h-9 items-center justify-center gap-10">
            <a
              href={siteConfig.phoneHref}
              className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-on-dark/85 transition-colors duration-[var(--duration-fast)] hover:text-on-dark"
            >
              <Phone className="size-3.5 text-accent" aria-hidden />
              {siteConfig.phone}
            </a>
            <nav aria-label={t.nav.main}>
              <NavLinks dense />
            </nav>
          </div>
        </div>

        <div className="container-page grid grid-cols-[1fr_auto_1fr] items-center gap-6 py-5">
          <ul className="flex items-center gap-2 justify-self-start">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={fill(t.footer.social, { name: siteConfig.name, network: s.label })}
                  className="grid size-10 place-items-center rounded-full border border-line-dark text-on-dark transition-colors duration-[var(--duration-fast)] hover:border-accent hover:bg-accent hover:text-on-accent"
                >
                  {s.icon}
                </a>
              </li>
            ))}
          </ul>
          <Logo href={href("/")} label={t.header.homeLink} tone="dark" size="xl" sparkle />
          <div className="flex items-center gap-1 justify-self-end">
            <ThemeToggle />
            <SearchDialog />
            <Link href={href("/account")} aria-label={t.me.link} title={t.me.link} className={headerIconButton}>
              <UserRound {...headerIcon} />
            </Link>
            <CartButton />
            <HideOnMenu>
              <ButtonLink href={href("/menu")} size="sm" className="group ml-3 h-11 gap-2.5 rounded-[var(--radius-sm)]! px-5 text-[0.9375rem]!">
                {t.common.orderNow}
                <ArrowRight
                  className="size-[1.125rem] transition-transform duration-[var(--duration-base)] group-hover:translate-x-0.5"
                  aria-hidden
                  strokeWidth={2.25}
                />
              </ButtonLink>
            </HideOnMenu>
          </div>
        </div>

        <div className="container-page pt-4 pb-2">
          <HeaderCategories categories={categoryLinks} tone="dark" withLanguages />
        </div>
      </div>

      <HeaderShell>
        <div className="container-page grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center gap-2 md:grid-cols-[auto_auto_1fr] md:gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6 xl:gap-10">
          <div className="justify-self-start lg:hidden">
            <MobileMenu categories={categoryLinks.map((c) => ({ slug: c.slug, name: c.name }))} />
          </div>

          <Logo
            href={href("/")}
            label={t.header.homeLink}
            tone="dark"
            size="lg"
            sparkle
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
            <HideOnMenu>
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
            </HideOnMenu>
          </div>
        </div>
      </HeaderShell>

      {/* Phones and tablets: the category row sits under the sticky bar and scrolls away with the page. */}
      <div className="container-page pt-4 lg:hidden">
        <HeaderCategories categories={categoryLinks} tone="page" withLanguages languageClassName="md:hidden" />
      </div>
    </>
  );
}
