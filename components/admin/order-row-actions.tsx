"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ArrowRight, ExternalLink, Loader2, MoreHorizontal, Phone, XCircle } from "lucide-react";
import type { DeliveryMethod, OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/actions/admin/orders";
import { useAdminI18n } from "@/components/admin/admin-i18n";
import { useDismiss } from "@/components/admin/admin-shell";
import { adminIconButton } from "@/components/admin/admin-ui";
import { fill } from "@/lib/i18n/config";
import { nextStatuses } from "@/lib/order-status";
import { cn } from "@/lib/utils";

/**
 * Row menu of the order list: open the order, call the customer, and the status changes allowed
 * from the current status — the same Server Action and rules as on the order page (the server
 * checks the transition again). Cancelling asks for confirmation.
 */
export function OrderRowActions({
  id,
  number,
  status,
  method,
  phone,
}: {
  id: string;
  number: string;
  status: OrderStatus;
  method: DeliveryMethod;
  phone: string;
}) {
  const { a } = useAdminI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), ref);
  const next = nextStatuses(status, method);

  function move(to: OrderStatus) {
    if (to === "CANCELLED" && !window.confirm(fill(a.ui.confirmCancel, { number }))) return;
    setOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(id, to);
      if (result.error) setError(result.error);
    });
  }

  const item = "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium hover:bg-sand";
  const neutral = "text-ink-soft hover:text-ink";

  return (
    <div ref={ref} className="relative inline-flex flex-col items-end">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={pending}
        className={cn(adminIconButton, "border border-transparent hover:border-line")}
        aria-label={fill(a.ui.rowActions, { number })}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <MoreHorizontal className="size-4.5" aria-hidden />}
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-30 mt-1 w-60 rounded-xl border border-line bg-paper p-1.5 text-left shadow-[var(--shadow-lift)]">
          <Link role="menuitem" href={`/admin/orders/${id}`} className={cn(item, neutral)} onClick={() => setOpen(false)}>
            <ExternalLink className="size-4 text-muted" aria-hidden /> {a.ui.openOrder}
          </Link>
          <a role="menuitem" href={`tel:${phone}`} className={cn(item, neutral)} onClick={() => setOpen(false)}>
            <Phone className="size-4 text-muted" aria-hidden /> {a.ui.callCustomer}
          </a>
          {next.length > 0 && <div className="my-1 border-t border-line" role="separator" />}
          {next.map((s) => (
            <button
              key={s}
              role="menuitem"
              type="button"
              onClick={() => move(s)}
              className={cn(item, s === "CANCELLED" ? "text-accent-ink" : neutral)}
            >
              {s === "CANCELLED" ? <XCircle className="size-4" aria-hidden /> : <ArrowRight className="size-4 text-muted" aria-hidden />}
              {fill(a.ui.moveTo, { status: a.status[s] })}
            </button>
          ))}
        </div>
      )}
      {error && (
        <span role="alert" className="mt-1 max-w-48 text-right text-xs font-medium text-accent-ink">
          {error || a.ui.statusFailed}
        </span>
      )}
    </div>
  );
}
