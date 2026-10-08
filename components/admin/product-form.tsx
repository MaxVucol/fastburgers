"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { AlertCircle, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { saveProduct, type ProductFormState } from "@/actions/admin/products";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { baniToInput } from "@/lib/format";
import { slugify } from "@/lib/utils";

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
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [preview, setPreview] = useState<string | null>(null);
  const [options, setOptions] = useState<OptionRow[]>(
    () => product?.options.map((o) => ({ key: newKey(), id: o.id, name: o.name, price: baniToInput(o.price), active: o.active })) ?? [],
  );

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

        <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-bold">Informații de bază</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nume" htmlFor="name" error={fe.name} required>
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
            <Field label="Slug (URL)" htmlFor="slug" error={fe.slug} hint={`/menu/${slug || "..."}`} required>
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
            <Field label="Categorie" htmlFor="categoryId" error={fe.categoryId} required>
              <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? categories[0]?.id} required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preț (lei)" htmlFor="price" error={fe.price} required>
                <Input id="price" name="price" inputMode="decimal" placeholder="32.90" defaultValue={baniToInput(product?.price)} required aria-invalid={fe.price ? true : undefined} />
              </Field>
              <Field label="Preț vechi" htmlFor="oldPrice" error={fe.oldPrice} hint="Pentru reducere">
                <Input id="oldPrice" name="oldPrice" inputMode="decimal" placeholder="—" defaultValue={baniToInput(product?.oldPrice)} aria-invalid={fe.oldPrice ? true : undefined} />
              </Field>
            </div>
          </div>
          <Field label="Descriere scurtă (card)" htmlFor="shortDescription" error={fe.shortDescription} hint="Max. 160 de caractere — apare pe cardul produsului." required>
            <Input id="shortDescription" name="shortDescription" maxLength={160} defaultValue={product?.shortDescription} required />
          </Field>
          <Field label="Descriere completă" htmlFor="description" error={fe.description} hint="Spune concret ce conține produsul." required>
            <Textarea id="description" name="description" rows={4} defaultValue={product?.description} required />
          </Field>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-bold">Ingrediente, alergeni și valori</h2>
          <Field label="Ingrediente" htmlFor="ingredients" error={fe.ingredients} hint="Câte unul pe linie sau separate prin virgulă.">
            <Textarea id="ingredients" name="ingredients" rows={4} defaultValue={product?.ingredients.join("\n")} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-soft">Alergeni</legend>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => (
                <label key={a} className="flex cursor-pointer items-center gap-2 rounded-lg bg-sand px-3 py-2 text-sm has-[:checked]:bg-mustard-soft has-[:checked]:font-semibold">
                  <Checkbox name="allergens" value={a} defaultChecked={product?.allergens.includes(a)} className="size-4" />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Gramaj / volum" htmlFor="weight" error={fe.weight}>
              <Input id="weight" name="weight" type="number" min={0} defaultValue={product?.weight ?? ""} />
            </Field>
            <Field label="Unitate" htmlFor="weightUnit" error={fe.weightUnit}>
              <Select id="weightUnit" name="weightUnit" defaultValue={product?.weightUnit ?? "g"}>
                <option value="g">grame (g)</option>
                <option value="ml">mililitri (ml)</option>
              </Select>
            </Field>
            <Field label="Calorii (kcal)" htmlFor="calories" error={fe.calories}>
              <Input id="calories" name="calories" type="number" min={0} defaultValue={product?.calories ?? ""} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Extra-uri și opțiuni</h2>
            <Button
              size="sm"
              variant="soft"
              onClick={() => setOptions((rows) => [...rows, { key: newKey(), name: "", price: "", active: true }])}
            >
              <Plus className="size-4" aria-hidden /> Adaugă opțiune
            </Button>
          </div>
          {Object.entries(fe).some(([k]) => k.startsWith("options")) && (
            <p className="text-sm text-accent" role="alert">Verifică opțiunile: fiecare are nevoie de nume și preț valid.</p>
          )}
          {options.length === 0 ? (
            <p className="text-sm text-muted">Fără extra-uri. Ex.: „Extra bacon” +7,00 lei.</p>
          ) : (
            <ul className="space-y-2">
              {options.map((o, i) => (
                <li key={o.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-cream p-2">
                  <label className="sr-only" htmlFor={`opt-name-${o.key}`}>Nume opțiune {i + 1}</label>
                  <Input id={`opt-name-${o.key}`} value={o.name} onChange={(e) => updateOption(o.key, { name: e.target.value })} placeholder="Extra cheddar" className="min-w-0 flex-[1_1_10rem]" />
                  <label className="sr-only" htmlFor={`opt-price-${o.key}`}>Preț opțiune {i + 1} (lei)</label>
                  <Input id={`opt-price-${o.key}`} value={o.price} onChange={(e) => updateOption(o.key, { price: e.target.value })} inputMode="decimal" placeholder="5.00" className="w-24" />
                  <label className="flex items-center gap-2 px-2 text-sm">
                    <Checkbox checked={o.active} onChange={(e) => updateOption(o.key, { active: e.target.checked })} className="size-4" />
                    Activă
                  </label>
                  <button
                    type="button"
                    onClick={() => setOptions((rows) => rows.filter((r) => r.key !== o.key))}
                    className="grid size-9 place-items-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent"
                    aria-label={`Elimină opțiunea ${o.name || i + 1}`}
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
        <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">Imagine principală</h2>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand">
            {preview || product?.image ? (
              // Local object URLs cannot go through the image optimizer.
              <Image src={preview ?? product?.image ?? ""} alt="Previzualizare imagine" fill sizes="352px" className="object-cover" unoptimized={Boolean(preview)} />
            ) : (
              <span className="grid h-full place-items-center text-muted">
                <ImagePlus className="size-8" aria-hidden />
              </span>
            )}
          </div>
          <Field label={product ? "Înlocuiește imaginea" : "Încarcă imaginea"} htmlFor="imageFile" error={fe.image} hint="JPG, PNG, WebP sau AVIF, max. 8 MB. Se convertește automat în WebP." required={!product}>
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

        <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">Galerie</h2>
          {gallery.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {gallery.map((src) => (
                <li key={src}>
                  <label className="group block cursor-pointer">
                    <span className="relative block aspect-square overflow-hidden rounded-lg bg-sand ring-2 ring-transparent group-has-[:checked]:ring-herb">
                      <Image src={src} alt="" fill sizes="110px" className="object-cover" />
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs">
                      <Checkbox name="keepImages" value={src} defaultChecked className="size-3.5" /> Păstrează
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <Field label="Adaugă imagini" htmlFor="galleryFiles" hint="Poți selecta mai multe fișiere (max. 8).">
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

        <section className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">Vizibilitate</h2>
          {[
            { name: "active", label: "Activ (vizibil în meniu)", value: product?.active ?? true },
            { name: "popular", label: "Popular", value: product?.popular ?? false },
            { name: "isNew", label: "Nou", value: product?.isNew ?? false },
            { name: "featured", label: "Recomandat / Best Seller", value: product?.featured ?? false },
          ].map((f) => (
            <label key={f.name} className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
              <Checkbox name={f.name} defaultChecked={f.value} />
              {f.label}
            </label>
          ))}
        </section>

        <div className="flex flex-col gap-3 min-[400px]:flex-row xl:sticky xl:bottom-4">
          <Button type="submit" size="lg" className="flex-1" disabled={pending}>
            {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
            {product ? "Salvează modificările" : "Creează produsul"}
          </Button>
          <Link href="/admin/products" className={buttonStyles({ size: "lg", variant: "outline" })}>
            Anulează
          </Link>
        </div>
      </div>
    </form>
  );
}
