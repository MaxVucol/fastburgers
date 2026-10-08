"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { AlertCircle, ImagePlus, Loader2 } from "lucide-react";
import { saveCategory, type CategoryFormState } from "@/actions/admin/categories";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { slugify } from "@/lib/utils";

export type CategoryFormValues = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  active: boolean;
};

export function CategoryForm({ category }: { category?: CategoryFormValues }) {
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(saveCategory, {});
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [preview, setPreview] = useState<string | null>(null);
  const fe = state.fieldErrors ?? {};
  const image = preview ?? category?.image ?? null;

  return (
    <form
      className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-[1fr_16rem]"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
        {state.error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-accent-soft p-3 text-sm font-semibold text-accent-hover">
            <AlertCircle className="size-5 shrink-0" aria-hidden /> {state.error}
          </p>
        )}
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
          />
        </Field>
        <Field label="Slug (URL)" htmlFor="slug" error={fe.slug} hint={`/categorii/${slug || "..."}`} required>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
          />
        </Field>
        <Field label="Descriere" htmlFor="description" error={fe.description} hint="Max. 240 de caractere.">
          <Textarea id="description" name="description" maxLength={240} rows={3} defaultValue={category?.description} />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
          <Checkbox name="active" defaultChecked={category?.active ?? true} /> Activă (vizibilă în site)
        </label>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4.5 animate-spin" aria-hidden />}
            {category ? "Salvează" : "Creează categoria"}
          </Button>
          <Link href="/admin/categories" className={buttonStyles({ variant: "outline" })}>
            Anulează
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-bold">Imagine</h2>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-sand">
          {image ? (
            <Image src={image} alt="Previzualizare" fill sizes="256px" className="object-cover" unoptimized={Boolean(preview)} />
          ) : (
            <span className="grid h-full place-items-center text-muted">
              <ImagePlus className="size-8" aria-hidden />
            </span>
          )}
        </div>
        <Field label="Încarcă imagine" htmlFor="imageFile" error={fe.image}>
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
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sand file:px-3 file:py-2 file:font-semibold"
          />
        </Field>
      </section>
    </form>
  );
}
