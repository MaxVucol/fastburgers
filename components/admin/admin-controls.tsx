"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Trash2 } from "lucide-react";
import type { DeliveryMethod, OrderStatus } from "@prisma/client";
import { deleteCategory, moveCategory, setCategoryActive } from "@/actions/admin/categories";
import { updateOrderStatus } from "@/actions/admin/orders";
import { deleteProduct, setProductFlag } from "@/actions/admin/products";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { fill } from "@/lib/i18n/config";
import { nextStatuses } from "@/lib/order-status";
import { cn } from "@/lib/utils";

function Switch({
  checked,
  pending,
  label,
  onToggle,
}: {
  checked: boolean;
  pending: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={pending}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
        checked ? "bg-herb" : "bg-oat",
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-paper shadow transition-transform", checked ? "translate-x-5.5" : "translate-x-0.5")} />
    </button>
  );
}

export function ProductFlagSwitch({
  id,
  flag,
  value,
  label,
}: {
  id: string;
  flag: "active" | "popular" | "isNew" | "featured" | "spicy" | "soldOut";
  value: boolean;
  label: string;
}) {
  const [optimistic, setOptimistic] = useState(value);
  const [prev, setPrev] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { msg } = useAdminI18n();
  if (value !== prev) {
    setPrev(value);
    setOptimistic(value);
  }
  return (
    <span className="inline-flex flex-col items-start">
      <Switch
        checked={optimistic}
        pending={pending}
        label={label}
        onToggle={() => {
          const next = !optimistic;
          setOptimistic(next);
          setError(null);
          startTransition(async () => {
            const result = await setProductFlag(id, flag, next);
            if (result.error) {
              // Refused on the server (e.g. publishing a draft): show why and put the switch back.
              setOptimistic(!next);
              setError(msg(result.error));
            }
          });
        }}
      />
      {error && (
        <span role="alert" className="mt-1 max-w-48 text-xs font-medium normal-case text-accent-ink">
          {error}
        </span>
      )}
    </span>
  );
}

export function CategoryActiveSwitch({ id, value, label }: { id: string; value: boolean; label: string }) {
  const [optimistic, setOptimistic] = useState(value);
  const [prev, setPrev] = useState(value);
  const [pending, startTransition] = useTransition();
  if (value !== prev) {
    setPrev(value);
    setOptimistic(value);
  }
  return (
    <Switch
      checked={optimistic}
      pending={pending}
      label={label}
      onToggle={() => {
        const next = !optimistic;
        setOptimistic(next);
        startTransition(() => setCategoryActive(id, next));
      }}
    />
  );
}

export function DeleteButton({
  id,
  kind,
  name,
}: {
  id: string;
  kind: "product" | "category";
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { a } = useAdminI18n();
  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(fill(a.products.confirmDelete, { name }))) return;
          setError(null);
          startTransition(async () => {
            const result = kind === "product" ? await deleteProduct(id) : await deleteCategory(id);
            if (result.error) setError(result.error);
          });
        }}
        className="grid size-9 place-items-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent-ink disabled:opacity-50"
        aria-label={fill(a.common.delete, { name })}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
      </button>
      {error && (
        <span role="alert" className="mt-1 max-w-56 text-right text-xs font-medium text-accent-ink">
          {error}
        </span>
      )}
    </span>
  );
}

export function MoveButtons({ id, isFirst, isLast, name }: { id: string; isFirst: boolean; isLast: boolean; name: string }) {
  const [pending, startTransition] = useTransition();
  const { a } = useAdminI18n();
  const btn = "grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-sand disabled:opacity-30";
  return (
    <span className="inline-flex flex-col">
      <button type="button" className={btn} disabled={pending || isFirst} onClick={() => startTransition(() => moveCategory(id, "up"))} aria-label={fill(a.categories.moveUp, { name })}>
        <ArrowUp className="size-4" aria-hidden />
      </button>
      <button type="button" className={btn} disabled={pending || isLast} onClick={() => startTransition(() => moveCategory(id, "down"))} aria-label={fill(a.categories.moveDown, { name })}>
        <ArrowDown className="size-4" aria-hidden />
      </button>
    </span>
  );
}

/** Only the transitions allowed from the current status are offered (the server checks them again). */
export function OrderStatusSelect({ id, status, method }: { id: string; status: OrderStatus; method: DeliveryMethod }) {
  const [value, setValue] = useState<OrderStatus>(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { a } = useAdminI18n();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`status-${id}`} className="text-sm font-semibold text-ink-soft">
        {a.status.label}
      </label>
      <div className="flex items-center gap-2">
        <select
          id={`status-${id}`}
          value={value}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as OrderStatus;
            setValue(next);
            setError(null);
            startTransition(async () => {
              const result = await updateOrderStatus(id, next);
              if (result.error) {
                setError(result.error);
                setValue(status);
              }
            });
          }}
          className="h-11 flex-1 cursor-pointer rounded-xl border border-line bg-paper px-3 font-semibold focus:border-accent focus:outline-none"
        >
          {[status, ...nextStatuses(status, method)].map((s) => (
            <option key={s} value={s}>
              {s === status ? fill(a.status.current, { label: a.status[s] }) : `→ ${a.status[s]}`}
            </option>
          ))}
        </select>
        {pending && <Loader2 className="size-5 animate-spin text-muted" aria-label={a.shell.saving} />}
      </div>
      {nextStatuses(status, method).length === 0 && <p className="text-xs text-muted">{a.status.final}</p>}
      {error && <p role="alert" className="text-sm text-accent-ink">{error}</p>}
    </div>
  );
}
