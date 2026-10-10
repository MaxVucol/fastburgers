import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, ClipboardList, FolderTree, Flame, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getDashboardStats } from "@/services/orders";

export const metadata: Metadata = { title: "Dashboard" };

function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
          <Icon className="size-4.5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getDashboardStats();
  const maxQty = Math.max(1, ...stats.topProducts.map((p) => p.quantity));

  return (
    <>
      <AdminPageHeader title="Dashboard" description="Privire de ansamblu asupra restaurantului." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Comenzi totale" value={String(stats.orderCount)} hint={`${stats.openOrders} în desfășurare`} icon={ClipboardList} />
        <StatCard label="Vânzări" value={formatPrice(stats.sales)} hint="Fără comenzile anulate" icon={Banknote} />
        <StatCard label="Produse active" value={String(stats.activeProducts)} icon={UtensilsCrossed} />
        <StatCard label="Categorii" value={String(stats.categoryCount)} icon={FolderTree} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Comenzi recente"
          action={<Link href="/admin/orders" className="text-sm font-semibold text-accent-ink hover:underline">Toate comenzile</Link>}
        >
          {stats.recentOrders.length === 0 ? (
            <p className="p-5 text-sm text-muted">Încă nu există comenzi.</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-cream">
                    <span className="font-mono text-sm font-semibold">{o.number}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{o.customerName}</span>
                    <span className="text-xs text-muted">{formatDateTime(o.createdAt)}</span>
                    <StatusBadge status={o.status} />
                    <span className="w-24 text-right font-semibold tabular-nums">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Produse populare · ultimele 30 de zile">
          {stats.topProducts.length === 0 ? (
            <p className="p-5 text-sm text-muted">Nu există vânzări în ultimele 30 de zile.</p>
          ) : (
            <ol className="space-y-4 p-5">
              {stats.topProducts.map((p, i) => (
                <li key={p.productId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      {i === 0 && <Flame className="size-4 text-accent" aria-hidden />}
                      {p.name}
                    </span>
                    <span className="text-muted tabular-nums">
                      {p.quantity} buc · {formatPrice(p.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand" aria-hidden>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(p.quantity / maxQty) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
