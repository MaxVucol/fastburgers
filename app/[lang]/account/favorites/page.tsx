import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { AccountPanel, AccountShell, AccountSkeleton } from "@/components/account/shell";
import { ProductList } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { listFavoriteIds } from "@/services/customer";
import { getMenu } from "@/services/localized-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.me.favorites.title, robots: { index: false } };
}

export default function AccountFavoritesPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Favorites />
    </Suspense>
  );
}

async function Favorites() {
  const { locale, t, href } = await getI18n();
  const user = await requireUser(href(`/account/login?next=${encodeURIComponent(href("/account/favorites"))}`));
  const [ids, menu] = await Promise.all([listFavoriteIds(user.id), getMenu(locale)]);
  // Only dishes that are on the menu right now (hidden or deleted ones drop out on their own).
  const byId = new Map(menu.products.map((p) => [p.id, p]));
  const products = ids.flatMap((id) => {
    const p = byId.get(id);
    return p ? [p] : [];
  });
  return (
    <AccountShell user={user} active="favorites" title={t.me.favorites.title} lead={t.me.favorites.lead}>
      {products.length === 0 ? (
        <AccountPanel>
          <p className="text-muted">{t.me.favorites.empty}</p>
          <ButtonLink href={href("/menu")} size="md" className="mt-4">
            {t.me.overview.browse}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </AccountPanel>
      ) : (
        <ProductList products={products} />
      )}
    </AccountShell>
  );
}
