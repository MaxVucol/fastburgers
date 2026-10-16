import Link from "next/link";
import { ArrowRight, CheckCircle2, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Shared building blocks of the admin panel. Colours come from the panel tokens (globals.css,
   `admin-ui`), so every piece works in the dark graphite and the light theme. */

/** Text inputs and selects of filter bars and forms in the panel. */
export const adminControl =
  "h-10 rounded-lg border border-line bg-sand px-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent focus:bg-paper focus:outline-none";

/** Buttons of the panel: compact, slightly rounded (the site keeps its round pills). */
const adminButtonBase =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0";
export const adminButton = {
  primary: `${adminButtonBase} bg-accent text-on-accent hover:bg-accent-hover`,
  dark: `${adminButtonBase} bg-ink text-on-ink hover:bg-ink-soft`,
  outline: `${adminButtonBase} border border-line bg-paper text-ink hover:border-oat hover:bg-sand`,
  ghost: `${adminButtonBase} text-ink-soft hover:bg-sand hover:text-ink`,
} as const;

/** Small icon button (edit, delete, row menus). */
export const adminIconButton =
  "grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-sand hover:text-ink disabled:opacity-40";

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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {(children || action) && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
          {action && (
            <Link href={action.href} className={adminButton.primary}>
              {action.icon}
              {action.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function SavedNotice({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-herb/30 bg-herb-soft px-4 py-3 text-sm font-semibold text-herb">
      <CheckCircle2 className="size-4.5" aria-hidden /> {children}
    </p>
  );
}

/** Status colours of the panel: one hue per stage, readable (AA) on both themes. */
const STATUS_TONE: Record<OrderStatus, string> = {
  NEW: "bg-accent-soft text-accent-ink ring-accent/25",
  CONFIRMED: "bg-[#e7eefc] text-[#1d4ed8] ring-[#1d4ed8]/20 dark:bg-[#132036] dark:text-[#93b4ff] dark:ring-[#93b4ff]/20",
  PREPARING: "bg-[#fdf1d6] text-[#8a5a00] ring-[#8a5a00]/20 dark:bg-[#2b2310] dark:text-[#e8b84a] dark:ring-[#e8b84a]/20",
  READY: "bg-[#dcf2e6] text-[#136c41] ring-[#136c41]/20 dark:bg-[#11271b] dark:text-[#62d39b] dark:ring-[#62d39b]/20",
  OUT_FOR_DELIVERY: "bg-[#e0f0fb] text-[#075985] ring-[#075985]/20 dark:bg-[#0f2432] dark:text-[#7cc7f5] dark:ring-[#7cc7f5]/20",
  COMPLETED: "bg-[#e9eeea] text-[#2f5d40] ring-[#2f5d40]/15 dark:bg-[#18221c] dark:text-[#9ccaab] dark:ring-[#9ccaab]/15",
  CANCELLED: "bg-sand text-muted ring-line",
};

/** `label` comes from the panel dictionary (a.status[status]). */
export function StatusBadge({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        STATUS_TONE[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

export function Panel({
  title,
  children,
  className,
  action,
  description,
  plain = false,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  description?: string;
  /** No rule under the title: the content brings its own side padding and starts right below. */
  plain?: boolean;
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line bg-paper", className)}>
      {title && (
        <div className={cn("flex items-center justify-between gap-3 px-5", plain ? "pt-4 pb-3" : "border-b border-line py-3.5")}>
          <div className="min-w-0">
            <h2 className="text-[0.9375rem] font-bold">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** "All orders →" style link in a panel heading. */
export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent-ink hover:underline">
      {children}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

export function EmptyState({ children, icon: Icon = Inbox }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted">
      <span className="grid size-10 place-items-center rounded-full bg-sand">
        <Icon className="size-5" aria-hidden />
      </span>
      {children}
    </div>
  );
}

/** Link-based segmented tabs (filters kept in the URL, so they work without JavaScript). */
export function SegmentTabs({
  label,
  items,
  className,
}: {
  label: string;
  items: { href: string; label: string; active: boolean; count?: number }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("no-scrollbar -mx-1 overflow-x-auto px-1", className)}>
      <ul className="flex w-max gap-1.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors",
                item.active ? "bg-accent text-on-accent" : "border border-line bg-paper text-ink-soft hover:border-oat hover:text-ink",
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span className={cn("rounded-md px-1.5 text-xs tabular-nums", item.active ? "bg-black/10" : "bg-sand text-muted")}>{item.count}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Column header row of a list "table" (hidden on small screens, where rows become cards). */
export function ListHead({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className={cn("hidden border-y border-line bg-cream/50 px-5 py-2.5 text-xs font-semibold text-muted", className)} aria-hidden>
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Change against the previous period: { text: "+12%", direction } or a plain hint when unknown. */
  trend?: { text: string; direction: "up" | "down" | "flat"; caption: string } | null;
  hint?: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-line bg-paper p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
        <Icon className="size-5" aria-hidden strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-1 font-display text-2xl leading-tight font-extrabold tracking-[-0.02em] tabular-nums">{value}</p>
        {trend ? (
          <p className="mt-1.5 text-xs text-muted">
            <span
              className={cn(
                "mr-1 font-semibold",
                trend.direction === "up" && "text-herb",
                trend.direction === "down" && "text-accent-ink",
                trend.direction === "flat" && "text-ink-soft",
              )}
            >
              {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.text}
            </span>
            {trend.caption}
          </p>
        ) : (
          hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
        )}
      </div>
    </div>
  );
}
