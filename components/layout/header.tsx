import Link from "next/link";
import { User } from "lucide-react";
import { CartButton } from "./cart-button";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { SearchDialog } from "./search-dialog";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-md supports-[backdrop-filter]:bg-cream/80">
      <div className="container-page flex h-16 items-center justify-between gap-3 md:h-[4.5rem]">
        <Logo className="shrink-0" />

        <nav aria-label="Principală" className="hidden md:block">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <SearchDialog triggerClassName="hidden md:grid" />
          <Link
            href="/account"
            className="hidden size-11 place-items-center rounded-xl text-ink transition-colors hover:bg-sand md:grid"
            aria-label="Contul meu și urmărirea comenzii"
          >
            <User className="size-5" aria-hidden />
          </Link>
          <CartButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
