import { getI18n } from "@/lib/i18n/server";
import { CartButton } from "./cart-button";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { SearchDialog } from "./search-dialog";

/**
 * Phones: menu · centred logo · cart. Desktop: logo · centred navigation · languages,
 * search and cart. Sticky, translucent cream with a hairline underneath.
 */
export async function Header() {
  const { t, href } = await getI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/92 backdrop-blur-md supports-[backdrop-filter]:bg-cream/85">
      <div className="container-page grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center gap-2 lg:grid-cols-[auto_1fr_auto] lg:gap-6">
        <div className="justify-self-start lg:hidden">
          <MobileMenu />
        </div>

        <Logo href={href("/")} label={t.header.homeLink} className="justify-self-center lg:justify-self-start" />

        <nav aria-label={t.nav.main} className="hidden justify-self-center lg:block">
          <NavLinks />
        </nav>

        <div className="flex items-center justify-self-end gap-0.5 sm:gap-1">
          <div className="mr-1 hidden items-center gap-2 md:flex">
            <LanguageSwitcher tone="light" />
            <span className="h-6 w-px bg-line" aria-hidden />
          </div>
          <SearchDialog triggerClassName="hidden sm:grid" />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
