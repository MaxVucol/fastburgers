import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { CartButton } from "./cart-button";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { SearchDialog } from "./search-dialog";

export async function Header() {
  const { t, href } = await getI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/92 backdrop-blur-md supports-[backdrop-filter]:bg-cream/85">
      <div className="container-page grid h-[var(--header-h)] grid-cols-[1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
        <Logo href={href("/")} label={t.header.homeLink} className="justify-self-start" />

        <nav aria-label={t.nav.main} className="hidden lg:block">
          <NavLinks />
        </nav>

        <div className="flex items-center justify-self-end gap-1 sm:gap-2">
          <SearchDialog triggerClassName="hidden sm:grid" />
          <CartButton />
          <span className="ml-1 hidden md:block">
            <ButtonLink href={href("/menu")} size="md">
              {t.common.orderNow}
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </span>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
