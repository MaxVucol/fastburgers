import { getAdmin } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

/**
 * Market comparison as CSV (administrators only — checked here, not just by the proxy).
 * One row per competitor offer; offers not linked to a BUNIQ dish have empty BUNIQ columns.
 */
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const [offers, products] = await Promise.all([
    prisma.competitorPrice.findMany({ orderBy: [{ category: "asc" }, { restaurant: "asc" }, { itemName: "asc" }] }),
    prisma.product.findMany({ select: { id: true, name: true, price: true } }),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const money = (bani: number) => (bani / 100).toFixed(2);

  const rows: (string | number | null)[][] = [
    ["Категория", "Товар BUNIQ", "Цена BUNIQ (MDL)", "Конкурент", "Сравнимый товар", "Тип", "Вес", "Цена конкурента (MDL)", "Источник", "Тип источника", "Дата проверки", "Заметки"],
    ...offers.map((o) => {
      const p = o.productId ? byId.get(o.productId) : undefined;
      return [
        o.category,
        p?.name ?? "",
        p ? money(p.price) : "",
        o.restaurant,
        o.itemName,
        o.offerType === "COMBO" ? "комбо" : "отдельный товар",
        o.size ?? "",
        money(o.price),
        o.sourceUrl,
        o.sourceType === "AGGREGATOR" ? "агрегатор" : "сайт ресторана",
        o.checkedAt.toISOString().slice(0, 10),
        o.notes ?? "",
      ];
    }),
  ];
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="buniq-piata-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
