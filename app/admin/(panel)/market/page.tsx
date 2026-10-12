import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Download, ExternalLink, Pencil } from "lucide-react";
import { AdminPageHeader, Panel } from "@/components/admin/admin-ui";
import { CompetitorForm, CsvImportForm, DeleteCompetitorButton, PriceChange } from "@/components/admin/market-controls";
import { buttonStyles } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate, formatPrice } from "@/lib/format";
import { cn, isObjectId } from "@/lib/utils";
import { CSV_COLUMNS, listCompetitorPrices, marketOverview, MIN_COMPARABLES, STALE_DAYS } from "@/services/market";

export const metadata: Metadata = { title: "Piață și prețuri" };

export default async function AdminMarketPage({ searchParams }: PageProps<"/admin/market">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const editId = typeof params.edit === "string" && isObjectId(params.edit) ? params.edit : "";
  const [overview, offers] = await Promise.all([marketOverview(), listCompetitorPrices({ q })]);
  const productName = new Map(overview.map((p) => [p.id, p.name]));
  const productOptions = overview.map((p) => ({ id: p.id, name: `${p.name}${p.draft ? " (ciornă)" : ""}` }));
  const editing = offers.find((o) => o.id === editId);

  return (
    <>
      <AdminPageHeader
        title="Piață și prețuri"
        description="Prețuri publicate de concurenți (MDL), introduse sau importate manual. Date interne: nu apar pe site."
      >
        {/* A file download from a route handler: a plain link, not client-side navigation. */}
        <a href="/admin/market-export" download className={buttonStyles({ variant: "outline", size: "md" })}>
          <Download className="size-4.5" aria-hidden /> Export CSV
        </a>
      </AdminPageHeader>

      <p className="mb-5 rounded-xl bg-mustard-soft p-4 text-sm">
        Reperul de piață este mediana ofertelor <strong>legate explicit</strong> de un produs BUNIQ și de același tip (produs separat / combo), doar
        dacă există cel puțin {MIN_COMPARABLES}. Prețul pieței nu este cost: fără costul de producție nu se poate calcula marja. Prețurile BUNIQ se
        schimbă doar după confirmare. Verificările mai vechi de {STALE_DAYS} de zile sunt marcate ca expirate.
      </p>

      <Panel title="Comparație pe produse">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="border-b border-line text-left text-xs font-bold tracking-wide text-muted uppercase">
              <tr>
                <th className="px-5 py-3">Produs BUNIQ</th>
                <th className="px-3 py-3">Preț BUNIQ</th>
                <th className="px-3 py-3">Oferte</th>
                <th className="px-3 py-3">Min – max</th>
                <th className="px-3 py-3">Reper (mediană)</th>
                <th className="px-3 py-3">Diferență</th>
                <th className="px-3 py-3">Verificat</th>
                <th className="px-5 py-3">Acțiune</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {overview.map((p) => (
                <tr key={p.id} className={cn(p.draft && "bg-cream/60")}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-accent-ink">{p.name}</Link>
                    <span className="block text-xs text-muted">
                      {p.category.name}
                      {p.weight ? ` · ${p.weight} ${p.weightUnit}` : ""}
                      {p.kind === "COMBO" ? " · combo" : ""}
                      {p.draft ? " · ciornă" : !p.active ? " · ascuns" : ""}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums">{formatPrice(p.price)}</td>
                  <td className="px-3 py-3 tabular-nums">{p.offers.length}</td>
                  <td className="px-3 py-3 tabular-nums">{p.min !== null && p.max !== null ? `${formatPrice(p.min)} – ${formatPrice(p.max)}` : "—"}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {p.benchmark !== null ? (
                      formatPrice(p.benchmark)
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <AlertTriangle className="size-3.5" aria-hidden /> Date insuficiente
                      </span>
                    )}
                  </td>
                  <td className={cn("px-3 py-3 font-semibold tabular-nums", p.gap !== null && p.gap < -15 ? "text-accent-ink" : p.gap !== null && p.gap > 15 ? "text-herb" : "")}>
                    {p.gap !== null ? `${p.gap > 0 ? "+" : ""}${p.gap}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {p.lastChecked ? (
                      <span className={cn(p.stale && "font-semibold text-accent-ink")}>
                        {formatDate(p.lastChecked)}
                        {p.stale ? " · expirat" : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <PriceChange productId={p.id} name={p.name} current={p.price} suggestion={p.benchmark} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel title={editing ? `Editează: ${editing.restaurant} · ${editing.itemName}` : "Adaugă un preț de concurent"}>
          <div className="p-5">
            <CompetitorForm
              key={editing?.id ?? "new"}
              products={productOptions}
              record={
                editing
                  ? { ...editing, checkedAt: editing.checkedAt.toISOString().slice(0, 10) }
                  : undefined
              }
            />
            {editing && (
              <Link href="/admin/market" className="mt-3 inline-block text-sm font-semibold text-muted hover:text-ink">Renunță la editare</Link>
            )}
          </div>
        </Panel>
        <Panel title="Import CSV">
          <div className="space-y-3 p-5 text-sm">
            <p className="text-muted">
              Coloane: <code className="text-xs break-words">{CSV_COLUMNS.join(", ")}</code>. Prețul în MDL (89.00), data AAAA-LL-ZZ, tipul SINGLE/COMBO,
              sursa RESTAURANT_SITE/AGGREGATOR, <code>buniq_slug</code> opțional. Dacă un rând e greșit, nu se importă nimic.
            </p>
            <CsvImportForm />
          </div>
        </Panel>
      </div>

      <Panel title={`Înregistrări (${offers.length})`} className="mt-6">
        <form role="search" className="flex gap-2 border-b border-line p-4">
          <label className="flex-1">
            <span className="sr-only">Caută</span>
            <input name="q" defaultValue={q} placeholder="Restaurant, produs, categorie…" className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-accent focus:outline-none" />
          </label>
          <button type="submit" className={buttonStyles({ variant: "dark", size: "sm" })}>Caută</button>
        </form>
        {offers.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nicio înregistrare.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead className="border-b border-line text-left text-xs font-bold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Restaurant · produs</th>
                  <th className="px-3 py-3">Categorie</th>
                  <th className="px-3 py-3">Preț</th>
                  <th className="px-3 py-3">Gramaj</th>
                  <th className="px-3 py-3">Tip</th>
                  <th className="px-3 py-3">Sursă</th>
                  <th className="px-3 py-3">Verificat</th>
                  <th className="px-3 py-3">BUNIQ</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {offers.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3">
                      <span className="font-semibold">{o.restaurant}</span> · {o.itemName}
                      {o.notes && <span className="block text-xs text-muted">{o.notes}</span>}
                    </td>
                    <td className="px-3 py-3">{o.category}</td>
                    <td className="px-3 py-3 font-semibold tabular-nums">{formatPrice(o.price)}</td>
                    <td className="px-3 py-3">{o.size ?? "—"}</td>
                    <td className="px-3 py-3">{o.offerType === "COMBO" ? "Combo" : "Separat"}</td>
                    <td className="px-3 py-3">
                      <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-accent-ink hover:underline">
                        {o.sourceType === "AGGREGATOR" ? "Agregator" : "Site"} <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </td>
                    <td className="px-3 py-3 text-xs">{formatDate(o.checkedAt)}</td>
                    <td className="px-3 py-3 text-xs">{o.productId ? (productName.get(o.productId) ?? "—") : "—"}</td>
                    <td className="px-5 py-3">
                      <span className="flex justify-end gap-1">
                        <Link href={`/admin/market?edit=${o.id}`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink" aria-label={`Editează ${o.itemName}`}>
                          <Pencil className="size-4" aria-hidden />
                        </Link>
                        <DeleteCompetitorButton id={o.id} label={`${o.restaurant} · ${o.itemName}`} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
