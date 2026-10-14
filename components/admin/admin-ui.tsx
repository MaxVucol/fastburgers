import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/button";
import { ORDER_STATUS_TONE } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string; icon?: ReactNode };
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {action && (
          <Link href={action.href} className={buttonStyles({ size: "md" })}>
            {action.icon}
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export function SavedNotice({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <p role="status" className="mb-5 flex items-center gap-2 rounded-xl bg-herb-soft px-4 py-3 text-sm font-semibold text-herb">
      <CheckCircle2 className="size-4.5" aria-hidden /> {children}
    </p>
  );
}

/** `label` comes from the panel dictionary (a.status[status]). */
export function StatusBadge({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap", ORDER_STATUS_TONE[status], className)}>
      {label}
    </span>
  );
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl bg-paper ring-1 ring-line", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-bold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
