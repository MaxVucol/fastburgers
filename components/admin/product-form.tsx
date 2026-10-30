"use client";

import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { AlertCircle, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { saveProduct, type ProductFormState } from "@/actions/admin/products";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { baniToInput, formatPrice, parsePriceToBani } from "@/lib/format";
import { fill } from "@/lib/i18n/config";
import { slugify } from "@/lib/utils";

/** Stored values (Romanian); the form shows them in the panel's language. */
export const ALLERGENS = [
  "Gluten", "Lapte", "Ouă", "Soia", "Muștar", "Susan", "Țelină",
  "Arahide", "Fructe cu coajă", "Pește", "Crustacee", "Moluște", "Sulfiți", "Lupin",
];

export type ProductFormValues = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  oldPrice: number | null;
  categoryId: string;
  ingredients: string[];
  allergens: string[];
  weight: number | null;
  weightUnit: string;
  calories: number | null;
  popular: boolean;
  featured: boolean;
  isNew: boolean;
  spicy: boolean;
  soldOut: boolean;
  draft: boolean;
  active: boolean;
  image: string;
  images: string[];
  options: { id: string; name: string; price: number; active: boolean }[];
};

type OptionRow = { key: string; id?: string; name: string; price: string; active: boolean };

let rowCounter = 0;
const newKey = () => `row-${++rowCounter}`;

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormValues;
}) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const { locale, a } = useAdminI18n();
  const f = a.productForm;
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [preview, setPreview] = useState<string | null>(null);
  const [options, setOptions] = useState<OptionRow[]>(
    () => product?.options.map((o) => ({ key: newKey(), id: o.id, name: o.name, price: baniToInput(o.price), active: o.active })) ?? [],
  );

  const [priceInput, setPriceInput] = useState(baniToInput(product?.price));
  const [draft, setDraft] = useState(product?.draft ?? false);
  // Editing the price of an existing dish needs an explicit confirmation (old → new), checked again on the server.
  const newPrice = parsePriceToBani(priceInput);
  const priceChanged = Boolean(product) && Number.isFinite(newPrice) && newPrice !== product?.price;

  const fe = state.fieldErrors ?? {};
  const gallery = product?.images.filter((src) => src !== product.image) ?? [];

  function updateOption(key: string, patch: Partial<OptionRow>) {
    setOptions((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <form
      className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]"
      onSubmit={(e) => {
        // Manual submit keeps field values when validation fails.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input
        type="hidden"
        name="options"
        value={JSON.stringify(options.map(({ id, name, price, active }) => ({ id, name, price, active })))}
      />

      <div className="space-y-6">
        {state.error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-accent-soft p-4 text-sm font-semibold text-accent-hover">
            <AlertCircle className="size-5 shrink-0" aria-hidden /> {state.error}
          </p>
        )}

        <section className="space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-bold">{f.basics}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={f.name} htmlFor="name" error={fe.name} required>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                required
                aria-invalid={fe.name ? true : undefined}
              />
            </Field>
            <Field label={f.slug} htmlFor="slug" error={fe.slug} hint={`/menu/${slug || "..."}`} required>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                required
                aria-invalid={fe.slug ? true : undefined}
              />
            </Field>
            <Field label={f.category} htmlFor="categoryId" error={fe.categoryId} required>
              <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? categories[0]?.id} required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={f.price} htmlFor="price" error={fe.price} required>
                <Input id="price" name="price" inputMode="decimal" placeholder="89.00" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} required aria-invalid={fe.price ? true : undefined} />
              </Field>
              <Field label={f.oldPrice} htmlFor="oldPrice" error={fe.oldPrice} hint={f.oldPriceHint}>
                <Input id="oldPrice" name="oldPrice" inputMode="decimal" placeholder="—" defaultValue={baniToInput(product?.oldPrice)} aria-invalid={fe.oldPrice ? true : undefined} />
              </Field>
            </div>
          </div>
          <Field label={f.short} htmlFor="shortDescription" error={fe.shortDescription} hint={f.shortHint} required>
            <Input id="shortDescription" name="shortDescription" maxLength={160} defaultValue={product?.shortDescription} required />
          </Field>
          <Field label={f.description} htmlFor="description" error={fe.description} hint={f.descriptionHint} required>
            <Textarea id="description" name="description" rows={4} defaultValue={product?.description} required />
          </Field>
        </section>

        <section className="space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-bold">{f.composition}</h2>
          <Field label={f.ingredients} htmlFor="ingredients" error={fe.ingredients} hint={f.ingredientsHint}>
            <Textarea id="ingredients" name="ingredients" rows={4} defaultValue={product?.ingredients.join("\n")} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-soft">{f.allergens}</legend>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((allergen) => (
                <label key={allergen} className="flex cursor-pointer items-center gap-2 rounded-lg bg-sand px-3 py-2 text-sm has-[:checked]:bg-mustard-soft has-[:checked]:font-semibold">
                  <Checkbox name="allergens" value={allergen} defaultChecked={product?.allergens.includes(allergen)} className="size-4" />
                  {a.allergens[allergen] ?? allergen}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={f.weight} htmlFor="weight" error={fe.weight}>
              <Input id="weight" name="weight" type="number" min={0} defaultValue={product?.weight ?? ""} />
            </Field>
            <Field label={f.unit} htmlFor="weightUnit" error={fe.weightUnit}>
              <Select id="weightUnit" name="weightUnit" defaultValue={product?.weightUnit ?? "g"}>
                <option value="g">{f.grams}</option>
                <option value="ml">{f.millilitres}</option>
              </Select>
            </Field>
            <Field label={f.calories} htmlFor="calories" error={fe.calories}>
              <Input id="calories" name="calories" type="number" min={0} defaultValue={product?.calories ?? ""} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{f.extras}</h2>
            <Button
              size="sm"
              variant="soft"
              onClick={() => setOptions((rows) => [...rows, { key: newKey(), name: "", price: "", active: true }])}
            >
              <Plus className="size-4" aria-hidden /> {f.addOption}
            </Button>
          </div>
          {Object.entries(fe).some(([k]) => k.startsWith("options")) && (
            <p className="text-sm text-accent-ink" role="alert">{f.optionsInvalid}</p>
          )}
          {options.length === 0 ? (
            <p className="text-sm text-muted">{f.noOptions}</p>
          ) : (
            <ul className="space-y-2">
              {options.map((o, i) => (
                <li key={o.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-cream p-2">
                  <label className="sr-only" htmlFor={`opt-name-${o.key}`}>{fill(f.optionName, { n: i + 1 })}</label>
                  <Input id={`opt-name-${o.key}`} value={o.name} onChange={(e) => updateOption(o.key, { name: e.target.value })} placeholder="Extra cheddar" className="min-w-0 flex-[1_1_10rem]" />
                  <label className="sr-only" htmlFor={`opt-price-${o.key}`}>{fill(f.optionPrice, { n: i + 1 })}</label>
                  <Input id={`opt-price-${o.key}`} value={o.price} onChange={(e) => updateOption(o.key, { price: e.target.value })} inputMode="decimal" placeholder="5.00" className="w-24" />
                  <label className="flex items-center gap-2 px-2 text-sm">
                    <Checkbox checked={o.active} onChange={(e) => updateOption(o.key, { active: e.target.checked })} className="size-4" />
                    {f.optionActive}
                  </label>
                  <button
                    type="button"
                    onClick={() => setOptions((rows) => rows.filter((r) => r.key !== o.key))}
                    className="grid size-9 place-items-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent-ink"
                    aria-label={fill(f.removeOption, { name: o.name || i + 1 })}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-line">
          <h2 className="font-bold">{f.mainImage}</h2>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand">
            {preview || product?.image ? (
              // Local object URLs cannot go through the image optimizer.
              <SmartImage src={preview ?? product?.image ?? ""} alt={f.preview} fill sizes="352px" className="object-cover" unoptimized={Boolean(preview)} />
            ) : (
              <span className="grid h-full place-items-center text-muted">
                <ImagePlus className="size-8" aria-hidden />
              </span>
            )}
          </div>
          <Field label={product ? f.replaceImage : f.uploadImage} htmlFor="imageFile" error={fe.image} hint={f.imageHint} required={!product}>
            <input
              id="imageFile"
              name="imageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (preview) URL.revokeObjectURL(preview);
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sand file:px-3 file:py-2 file:font-semibold hover:file:bg-oat"
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-line">
          <h2 className="font-bold">{f.gallery}</h2>
          {gallery.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {gallery.map((src) => (
                <li key={src}>
                  <label className="group block cursor-pointer">
                    <span className="relative block aspect-square overflow-hidden rounded-lg bg-sand ring-2 ring-transparent group-has-[:checked]:ring-herb">
                      <SmartImage src={src} alt="" fill sizes="110px" className="object-cover" />
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs">
                      <Checkbox name="keepImages" value={src} defaultChecked className="size-3.5" /> {f.keep}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <Field label={f.addImages} htmlFor="galleryFiles" hint={f.addImagesHint}>
            <input
              id="galleryFiles"
              name="galleryFiles"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sand file:px-3 file:py-2 file:font-semibold hover:file:bg-oat"
            />
          </Field>
        </section>

        {priceChanged && product && (
          <section className="rounded-2xl bg-mustard-soft p-5 ring-1 ring-line" aria-live="polite">
            <h2 className="font-bold">{f.priceChange}</h2>
            <p className="mt-1 text-sm">
              <span className="tabular-nums">{formatPrice(product.price, locale)}</span> → <span className="font-bold tabular-nums">{formatPrice(newPrice, locale)}</span>
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm font-semibold">
              <Checkbox name="confirmPrice" value={String(newPrice)} className="mt-0.5" />
              {f.confirmPrice}
            </label>
          </section>
        )}

        <section className="space-y-3 rounded-2xl bg-paper p-5 ring-1 ring-line">
          <h2 className="font-bold">{f.visibility}</h2>
          <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold">
            <Checkbox name="draft" checked={draft} onChange={(e) => setDraft(e.target.checked)} className="mt-0.5" />
            <span>
              {f.draft}
              <span className="block text-xs font-normal text-muted">{f.draftHint}</span>
            </span>
          </label>
          {[
            { name: "active", label: f.active, value: product?.active ?? !draft, disabled: draft },
            { name: "soldOut", label: f.soldOut, value: product?.soldOut ?? false },
            { name: "popular", label: f.popular, value: product?.popular ?? false },
            { name: "isNew", label: f.isNew, value: product?.isNew ?? false },
            { name: "spicy", label: f.spicy, value: product?.spicy ?? false },
            { name: "featured", label: f.featured, value: product?.featured ?? false },
          ].map((f) => (
            <label key={f.name} className={`flex cursor-pointer items-center gap-3 text-sm font-semibold ${f.disabled ? "opacity-50" : ""}`}>
              <Checkbox name={f.name} defaultChecked={f.value} disabled={f.disabled} />
              {f.label}
            </label>
          ))}
        </section>

        <div className="flex flex-col gap-3 min-[400px]:flex-row xl:sticky xl:bottom-4">
          <Button type="submit" size="lg" className="flex-1" disabled={pending}>
            {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
            {product ? f.saveChanges : f.create}
          </Button>
          <Link href="/admin/products" className={buttonStyles({ size: "lg", variant: "outline" })}>
            {a.common.cancel}
          </Link>
        </div>
      </div>
    </form>
  );
}
