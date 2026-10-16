import Image from "next/image";
import Link from "next/link";
import { ImageOff, Pencil, Plus, Search } from "lucide-react";
import { DeleteButton, ProductFlagSwitch } from "@/components/admin/admin-controls";
import { AdminPageHeader, EmptyState, Panel, SavedNotice, adminControl, adminIconButton, adminButton } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { isObjectId } from "@/lib/utils";
import { listCategoryOptions, listProductsAdmin, type ProductSort, type ProductStatusFilter } from "@/services/admin-catalog";

export const generateMetadata = () => adminTitle("products");

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const t = a.products;
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const categoryId = typeof params.category === "string" && isObjectId(params.category) ? params.category : "";
  const STATUSES: Record<ProductStatusFilter, string> = t.statuses;
  const SORTS: Record<ProductSort, string> = t.sorts;
  const status = (Object.keys(STATUSES) as ProductStatusFilter[]).find((k) => k === params.status);
  const sort = (Object.keys(SORTS) as ProductSort[]).find((k) => k === params.sort) ?? "order";
  const [products, categories] = await Promise.all([
    listProductsAdmin({ q, categoryId, status, sort }),
    listCategoryOptions(),
  ]);
  const select = `${adminControl} w-full`;

  return (
    <>
      <AdminPageHeader
        title={a.meta.products}
        description={fill(q || categoryId || status ? t.found : t.count, { count: products.length })}
        action={{ href: "/admin/products/new", label: t.new, icon: <Plus className="size-4.5" aria-hidden /> }}
      />
      <SavedNotice show={params.saved === "1"}>{t.saved}</SavedNotice>

      <form className="mb-5 flex flex-col gap-2 rounded-2xl border border-line bg-paper p-3 sm:flex-row" role="search">
        <label className="relative flex-1">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder={t.searchPlaceholder} className={`${adminControl} w-full pl-9`} />
        </label>
        <label>
          <span className="sr-only">{t.category}</span>
          <select name="category" defaultValue={categoryId} className={`${select} sm:w-48`}>
            <option value="">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{a.common.status}</span>
          <select name="status" defaultValue={status ?? ""} className={`${select} sm:w-40`}>
            <option value="">{a.common.allStatuses}</option>
            {Object.entries(STATUSES).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t.sort}</span>
          <select name="sort" defaultValue={sort} className={`${select} sm:w-44`}>
            {Object.entries(SORTS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <button type="submit" className={adminButton.dark}>{a.common.filter}</button>
      </form>

      <Panel>
        <div className="hidden grid-cols-[3.5rem_1fr_7rem_4rem_4.5rem_4rem_4rem_4rem_5.5rem] gap-4 border-b border-line px-5 py-3 text-xs font-semibold text-muted lg:grid">
          <span />
          <span>{t.colProduct}</span>
          <span>{t.colPrice}</span>
          <span>{t.colActive}</span>
          <span>{t.colSoldOut}</span>
          <span>{t.colPopular}</span>
          <span>{t.colNew}</span>
          <span>{t.colSpicy}</span>
          <span className="text-right">{t.colActions}</span>
        </div>
        {products.length === 0 ? (
          <EmptyState>{t.empty}</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-3.5 transition-colors hover:bg-sand/40 lg:grid-cols-[3.5rem_1fr_7rem_4rem_4.5rem_4rem_4rem_4rem_5.5rem]"
              >
                <span className="relative grid size-14 place-items-center overflow-hidden rounded-lg bg-sand text-muted">
                  {p.image ? <Image src={p.image} alt="" fill sizes="56px" className="object-cover" /> : <ImageOff className="size-5" aria-label={t.noPhoto} />}
                </span>
                <span className="min-w-0">
                  <Link href={`/admin/products/${p.id}`} className="block truncate font-semibold hover:text-accent-ink">
                    {p.name}
                  </Link>
                  <span className="block truncate text-xs text-muted">
                    {p.draft && <span className="mr-1.5 rounded-full bg-mustard-soft px-2 py-0.5 font-semibold text-[#8a5a00] dark:text-[#e8b84a]">{t.draft}</span>}
                    {p.category.name} · /{p.slug} · {fill(t.options, { count: p._count.options })}
                  </span>
                </span>
                <span className="text-right text-sm lg:text-left">
                  <span className="block font-semibold tabular-nums">{formatPrice(p.price, locale)}</span>
                  {p.oldPrice && <span className="block text-xs text-muted line-through tabular-nums">{formatPrice(p.oldPrice, locale)}</span>}
                </span>
                <div className="col-span-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted lg:contents">
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">{t.active}</span>
                    <ProductFlagSwitch id={p.id} flag="active" value={p.active} label={fill(t.switchActive, { name: p.name })} />
                  </label>
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">{t.soldOut}</span>
                    <ProductFlagSwitch id={p.id} flag="soldOut" value={p.soldOut ?? false} label={fill(t.switchSoldOut, { name: p.name })} />
                  </label>
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">{t.popular}</span>
                    <ProductFlagSwitch id={p.id} flag="popular" value={p.popular} label={fill(t.switchPopular, { name: p.name })} />
                  </label>
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">{t.isNew}</span>
                    <ProductFlagSwitch id={p.id} flag="isNew" value={p.isNew} label={fill(t.switchNew, { name: p.name })} />
                  </label>
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">{t.spicy}</span>
                    <ProductFlagSwitch id={p.id} flag="spicy" value={p.spicy ?? false} label={fill(t.switchSpicy, { name: p.name })} />
                  </label>
                  <span className="ml-auto flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className={adminIconButton}
                      aria-label={fill(a.common.edit, { name: p.name })}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Link>
                    <DeleteButton id={p.id} kind="product" name={p.name} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
