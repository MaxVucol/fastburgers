import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Pencil, Plus, Search } from "lucide-react";
import { DeleteButton, ProductFlagSwitch } from "@/components/admin/admin-controls";
import { AdminPageHeader, Panel, SavedNotice } from "@/components/admin/admin-ui";
import { buttonStyles } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { isObjectId } from "@/lib/utils";
import { listCategoryOptions, listProductsAdmin, type ProductSort, type ProductStatusFilter } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Produse" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const categoryId = typeof params.category === "string" && isObjectId(params.category) ? params.category : "";
  const STATUSES: Record<ProductStatusFilter, string> = { published: "Publicate", hidden: "Ascunse", draft: "Ciorne", soldOut: "Indisponibile" };
  const SORTS: Record<ProductSort, string> = { order: "Ordinea din meniu", name: "Nume", "price-asc": "Preț crescător", "price-desc": "Preț descrescător", updated: "Modificate recent" };
  const status = (Object.keys(STATUSES) as ProductStatusFilter[]).find((k) => k === params.status);
  const sort = (Object.keys(SORTS) as ProductSort[]).find((k) => k === params.sort) ?? "order";
  const [products, categories] = await Promise.all([
    listProductsAdmin({ q, categoryId, status, sort }),
    listCategoryOptions(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Produse"
        description={`${products.length} produse${q || categoryId || status ? " găsite" : " în total"}.`}
        action={{ href: "/admin/products/new", label: "Produs nou", icon: <Plus className="size-4.5" aria-hidden /> }}
      />
      <SavedNotice show={params.saved === "1"}>Produsul a fost salvat.</SavedNotice>

      <form className="mb-5 flex flex-col gap-2 sm:flex-row" role="search">
        <label className="relative flex-1">
          <span className="sr-only">Caută produs</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Caută după nume sau slug…" className="h-11 w-full rounded-xl border border-line bg-white pr-3 pl-10 focus:border-accent focus:outline-none" />
        </label>
        <label>
          <span className="sr-only">Categorie</span>
          <select name="category" defaultValue={categoryId} className="h-11 w-full rounded-xl border border-line bg-white px-3 sm:w-48">
            <option value="">Toate categoriile</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status ?? ""} className="h-11 w-full rounded-xl border border-line bg-white px-3 sm:w-40">
            <option value="">Toate statusurile</option>
            {Object.entries(STATUSES).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sortare</span>
          <select name="sort" defaultValue={sort} className="h-11 w-full rounded-xl border border-line bg-white px-3 sm:w-44">
            {Object.entries(SORTS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonStyles({ variant: "dark" })}>Filtrează</button>
      </form>

      <Panel>
        <div className="hidden grid-cols-[3.5rem_1fr_7rem_4rem_4.5rem_4rem_4rem_4rem_5.5rem] gap-4 border-b border-line px-5 py-3 text-xs font-bold tracking-wide text-muted uppercase lg:grid">
          <span />
          <span>Produs</span>
          <span>Preț</span>
          <span>Activ</span>
          <span>Indisp.</span>
          <span>Popular</span>
          <span>Nou</span>
          <span>Picant</span>
          <span className="text-right">Acțiuni</span>
        </div>
        {products.length === 0 ? (
          <p className="p-6 text-sm text-muted">Niciun produs găsit.</p>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-3.5 lg:grid-cols-[3.5rem_1fr_7rem_4rem_4.5rem_4rem_4rem_4rem_5.5rem]"
              >
                <span className="relative grid size-14 place-items-center overflow-hidden rounded-lg bg-sand text-muted">
                  {p.image ? <Image src={p.image} alt="" fill sizes="56px" className="object-cover" /> : <ImageOff className="size-5" aria-label="Fără fotografie" />}
                </span>
                <span className="min-w-0">
                  <Link href={`/admin/products/${p.id}`} className="block truncate font-semibold hover:text-accent-ink">
                    {p.name}
                  </Link>
                  <span className="block truncate text-xs text-muted">
                    {p.draft && <span className="mr-1.5 rounded-full bg-mustard-soft px-2 py-0.5 font-semibold text-[#8a5a00]">ciornă</span>}
                    {p.category.name} · /{p.slug} · {p._count.options} opțiuni
                  </span>
                </span>
                <span className="text-right text-sm lg:text-left">
                  <span className="block font-semibold tabular-nums">{formatPrice(p.price)}</span>
                  {p.oldPrice && <span className="block text-xs text-muted line-through tabular-nums">{formatPrice(p.oldPrice)}</span>}
                </span>
                <div className="col-span-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted lg:contents">
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">Activ</span>
                    <ProductFlagSwitch id={p.id} flag="active" value={p.active} label={`${p.name} activ`} />
                  </label>
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">Indisponibil</span>
                    <ProductFlagSwitch id={p.id} flag="soldOut" value={p.soldOut ?? false} label={`${p.name} indisponibil temporar`} />
                  </label>
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">Popular</span>
                    <ProductFlagSwitch id={p.id} flag="popular" value={p.popular} label={`${p.name} popular`} />
                  </label>
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">Nou</span>
                    <ProductFlagSwitch id={p.id} flag="isNew" value={p.isNew} label={`${p.name} nou`} />
                  </label>
                  <label className="flex items-center gap-2 lg:block">
                    <span className="lg:sr-only">Picant</span>
                    <ProductFlagSwitch id={p.id} flag="spicy" value={p.spicy ?? false} label={`${p.name} picant`} />
                  </label>
                  <span className="ml-auto flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink"
                      aria-label={`Editează ${p.name}`}
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
