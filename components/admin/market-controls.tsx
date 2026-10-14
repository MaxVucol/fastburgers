"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  deleteCompetitorAction,
  importCompetitorCsvAction,
  saveCompetitorAction,
  setPriceFromMarketAction,
  type MarketFormState,
} from "@/actions/admin/market";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/i18n/config";
import { baniToInput, formatPrice, parsePriceToBani } from "@/lib/format";

const input = "h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm focus:border-accent focus:outline-none";

function Messages({ state }: { state: MarketFormState }) {
  const { msg } = useAdminI18n();
  return (
    <div aria-live="polite">
      {state.error && <p role="alert" className="text-sm font-semibold text-accent-ink">{state.error}</p>}
      {state.errors && state.errors.length > 0 && (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-accent-ink">
          {state.errors.map((e) => (
            <li key={e}>{msg(e)}</li>
          ))}
        </ul>
      )}
      {state.notice && <p className="text-sm font-semibold text-herb">{state.notice}</p>}
    </div>
  );
}

export type CompetitorRecord = {
  id: string;
  restaurant: string;
  itemName: string;
  category: string;
  price: number;
  size: string | null;
  offerType: "SINGLE" | "COMBO";
  sourceType: "RESTAURANT_SITE" | "AGGREGATOR";
  sourceUrl: string;
  checkedAt: string;
  notes: string | null;
  productId: string | null;
};

/** Add (or, with `record`, edit) one competitor offer. */
export function CompetitorForm({ products, record }: { products: { id: string; name: string }[]; record?: CompetitorRecord }) {
  const [state, action, pending] = useActionState<MarketFormState, FormData>(saveCompetitorAction, {});
  const { a } = useAdminI18n();
  const t = a.market;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      {record && <input type="hidden" name="id" value={record.id} />}
      <label className="text-xs font-semibold">{t.fRestaurant}<input name="restaurant" required defaultValue={record?.restaurant} className={input} /></label>
      <label className="text-xs font-semibold">{t.fItem}<input name="itemName" required defaultValue={record?.itemName} className={input} /></label>
      <label className="text-xs font-semibold">{t.fCategory}<input name="category" required defaultValue={record?.category} placeholder={t.fCategoryPlaceholder} className={input} /></label>
      <label className="text-xs font-semibold">{t.fPrice}<input name="price" required inputMode="decimal" defaultValue={record ? baniToInput(record.price) : ""} placeholder="89.00" className={input} /></label>
      <label className="text-xs font-semibold">{t.fSize}<input name="size" defaultValue={record?.size ?? ""} placeholder="380 g" className={input} /></label>
      <label className="text-xs font-semibold">
        {t.fType}
        <select name="offerType" defaultValue={record?.offerType ?? "SINGLE"} className={input}>
          <option value="SINGLE">{t.fTypeSingle}</option>
          <option value="COMBO">{t.fTypeCombo}</option>
        </select>
      </label>
      <label className="text-xs font-semibold">
        {t.fSource}
        <select name="sourceType" defaultValue={record?.sourceType ?? "RESTAURANT_SITE"} className={input}>
          <option value="RESTAURANT_SITE">{t.fSourceSite}</option>
          <option value="AGGREGATOR">{t.fSourceAggregator}</option>
        </select>
      </label>
      <label className="text-xs font-semibold">{t.fUrl}<input name="sourceUrl" type="url" required defaultValue={record?.sourceUrl} placeholder="https://" className={input} /></label>
      <label className="text-xs font-semibold">{t.fChecked}<input name="checkedAt" type="date" required max={today} defaultValue={record?.checkedAt ?? today} className={input} /></label>
      <label className="text-xs font-semibold">
        {t.fProduct}
        <select name="productId" defaultValue={record?.productId ?? ""} className={input}>
          <option value="">{t.fUnlinked}</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold sm:col-span-2">{t.fNotes}<input name="notes" defaultValue={record?.notes ?? ""} className={input} /></label>
      <div className="flex flex-col gap-2 sm:col-span-2 xl:col-span-4">
        <Messages state={state} />
        <Button type="submit" variant="dark" disabled={pending} className="self-start">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {record ? t.save : t.addButton}
        </Button>
      </div>
    </form>
  );
}

export function CsvImportForm() {
  const [state, action, pending] = useActionState<MarketFormState, FormData>(importCompetitorCsvAction, {});
  const { a } = useAdminI18n();
  return (
    <form action={action} className="space-y-3">
      <input name="file" type="file" accept=".csv,text/csv" required className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sand file:px-3 file:py-2 file:font-semibold hover:file:bg-oat" />
      <Messages state={state} />
      <Button type="submit" variant="dark" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {a.market.importButton}
      </Button>
    </form>
  );
}

export function DeleteCompetitorButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const { a } = useAdminI18n();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(fill(a.market.confirmDelete, { label }))) return;
        startTransition(async () => {
          await deleteCompetitorAction(id);
        });
      }}
      className="grid size-9 place-items-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent-ink disabled:opacity-50"
      aria-label={fill(a.common.delete, { name: label })}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
    </button>
  );
}

/**
 * Information only until the administrator acts: type a new price, check "old → new", confirm.
 * The server refuses if the price changed meanwhile.
 */
export function PriceChange({ productId, name, current, suggestion }: { productId: string; name: string; current: number; suggestion: number | null }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(suggestion ? baniToInput(suggestion) : baniToInput(current));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { locale, a } = useAdminI18n();
  const t = a.market;
  const price = (bani: number) => formatPrice(bani, locale);
  const next = parsePriceToBani(value);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-accent-ink hover:underline">
        {t.changePrice}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold">
        {fill(t.newPrice, { name })}
        <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className={`${input} mt-1 w-28`} />
      </label>
      {Number.isFinite(next) && (
        <p className="text-xs">
          {price(current)} → <strong>{price(next)}</strong>
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !Number.isFinite(next) || next === current}
          onClick={() => {
            if (!window.confirm(fill(t.confirmChange, { name, from: price(current), to: price(next) }))) return;
            setError(null);
            startTransition(async () => {
              const result = await setPriceFromMarketAction(productId, current, value);
              if (result.error) setError(result.error);
              else setOpen(false);
            });
          }}
        >
          {t.confirm}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          {t.giveUp}
        </Button>
      </div>
      {error && <p role="alert" className="text-xs font-semibold text-accent-ink">{error}</p>}
    </div>
  );
}
