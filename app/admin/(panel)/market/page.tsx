import Link from "next/link";
import { AlertTriangle, Download, ExternalLink, Pencil } from "lucide-react";
import { AdminPageHeader, EmptyState, Panel, adminButton, adminControl } from "@/components/admin/admin-ui";
import { CompetitorForm, CsvImportForm, DeleteCompetitorButton, PriceChange } from "@/components/admin/market-controls";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate, formatPrice } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { adminTitle, getAdminI18n } from "@/lib/i18n/admin/server";
import { cn, isObjectId } from "@/lib/utils";
import { CSV_COLUMNS, listCompetitorPrices, marketOverview, MIN_COMPARABLES, STALE_DAYS } from "@/services/market";

export const generateMetadata = () => adminTitle("market");
// Re-checks the admin on every request (never cached), so navigating here waits for the server.
export const instant = false;

export default async function AdminMarketPage({ searchParams }: PageProps<"/admin/market">) {
  await requireAdmin();
  const { locale, a } = await getAdminI18n();
  const t = a.market;
  const price = (bani: number) => formatPrice(bani, locale);
  const date = (d: Date) => formatDate(d, locale);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const editId = typeof params.edit === "string" && isObjectId(params.edit) ? params.edit : "";
  const [overview, offers] = await Promise.all([marketOverview(), listCompetitorPrices({ q })]);
  const productName = new Map(overview.map((p) => [p.id, p.name]));
  const productOptions = overview.map((p) => ({ id: p.id, name: `${p.name}${p.draft ? ` (${t.draft})` : ""}` }));
  const editing = offers.find((o) => o.id === editId);

  return (
    <>
      <AdminPageHeader
        title={a.meta.market}
        description={t.lead}
      >
        {/* A file download from a route handler: a plain link, not client-side navigation. */}
        <a href="/admin/market-export" download className={adminButton.outline}>
          <Download className="size-4.5" aria-hidden /> {t.export}
        </a>
      </AdminPageHeader>

      <p className="mb-5 rounded-2xl border border-line bg-paper p-4 text-sm text-ink-soft">{fill(t.explain, { min: MIN_COMPARABLES, days: STALE_DAYS })}</p>

      <Panel title={t.comparison}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="border-b border-line text-left text-xs font-semibold text-muted">
              <tr>
                <th className="px-5 py-3">{t.colProduct}</th>
                <th className="px-3 py-3">{t.colPrice}</th>
                <th className="px-3 py-3">{t.colOffers}</th>
                <th className="px-3 py-3">{t.colRange}</th>
                <th className="px-3 py-3">{t.colBenchmark}</th>
                <th className="px-3 py-3">{t.colGap}</th>
                <th className="px-3 py-3">{t.colChecked}</th>
                <th className="px-5 py-3">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {overview.map((p) => (
                <tr key={p.id} className={cn("transition-colors hover:bg-sand/40", p.draft && "bg-sand/30")}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-accent-ink">{p.name}</Link>
                    <span className="block text-xs text-muted">
                      {p.category.name}
                      {p.weight ? ` · ${p.weight} ${p.weightUnit}` : ""}
                      {p.kind === "COMBO" ? " · combo" : ""}
                      {p.draft ? ` · ${t.draft}` : !p.active ? ` · ${t.hidden}` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums">{price(p.price)}</td>
                  <td className="px-3 py-3 tabular-nums">{p.offers.length}</td>
                  <td className="px-3 py-3 tabular-nums">{p.min !== null && p.max !== null ? `${price(p.min)} – ${price(p.max)}` : "—"}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {p.benchmark !== null ? (
                      price(p.benchmark)
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <AlertTriangle className="size-3.5" aria-hidden /> {t.insufficient}
                      </span>
                    )}
                  </td>
                  <td className={cn("px-3 py-3 font-semibold tabular-nums", p.gap !== null && p.gap < -15 ? "text-accent-ink" : p.gap !== null && p.gap > 15 ? "text-herb" : "")}>
                    {p.gap !== null ? `${p.gap > 0 ? "+" : ""}${p.gap}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {p.lastChecked ? (
                      <span className={cn(p.stale && "font-semibold text-accent-ink")}>
                        {date(p.lastChecked)}
                        {p.stale ? ` · ${t.stale}` : ""}
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
        <Panel title={editing ? fill(t.editing, { name: `${editing.restaurant} · ${editing.itemName}` }) : t.add}>
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
              <Link href="/admin/market" className="mt-3 inline-block text-sm font-semibold text-muted hover:text-ink">{t.cancelEdit}</Link>
            )}
          </div>
        </Panel>
        <Panel title={t.import}>
          <div className="space-y-3 p-5 text-sm">
            <p className="text-muted">
              {t.columns} <code className="text-xs break-words">{CSV_COLUMNS.join(", ")}</code>. {t.importHelp}
            </p>
            <CsvImportForm />
          </div>
        </Panel>
      </div>

      <Panel title={fill(t.records, { count: offers.length })} className="mt-6">
        <form role="search" className="flex gap-2 border-b border-line p-4">
          <label className="flex-1">
            <span className="sr-only">{a.common.search}</span>
            <input name="q" defaultValue={q} placeholder={t.searchPlaceholder} className={`${adminControl} w-full`} />
          </label>
          <button type="submit" className={adminButton.dark}>{a.common.search}</button>
        </form>
        {offers.length === 0 ? (
          <EmptyState>{t.empty}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead className="border-b border-line text-left text-xs font-semibold text-muted">
                <tr>
                  <th className="px-5 py-3">{t.colRestaurant}</th>
                  <th className="px-3 py-3">{t.colCategory}</th>
                  <th className="px-3 py-3">{t.colRecordPrice}</th>
                  <th className="px-3 py-3">{t.colSize}</th>
                  <th className="px-3 py-3">{t.colType}</th>
                  <th className="px-3 py-3">{t.colSource}</th>
                  <th className="px-3 py-3">{t.colChecked}</th>
                  <th className="px-3 py-3">{t.colBuniq}</th>
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
                    <td className="px-3 py-3 font-semibold tabular-nums">{price(o.price)}</td>
                    <td className="px-3 py-3">{o.size ?? "—"}</td>
                    <td className="px-3 py-3">{o.offerType === "COMBO" ? t.combo : t.single}</td>
                    <td className="px-3 py-3">
                      <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-accent-ink hover:underline">
                        {o.sourceType === "AGGREGATOR" ? t.aggregator : t.site} <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </td>
                    <td className="px-3 py-3 text-xs">{date(o.checkedAt)}</td>
                    <td className="px-3 py-3 text-xs">{o.productId ? (productName.get(o.productId) ?? "—") : "—"}</td>
                    <td className="px-5 py-3">
                      <span className="flex justify-end gap-1">
                        <Link href={`/admin/market?edit=${o.id}`} className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-sand hover:text-ink" aria-label={fill(a.common.edit, { name: o.itemName })}>
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
