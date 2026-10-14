import "server-only";
import type { DeliveryMethod, PaymentMethod } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { paymentBankName } from "@/lib/payment-banks";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";
import { escapeTelegramHtml as esc, sendTelegramMessage, telegramEnabled, type TelegramResult } from "@/lib/telegram";

/** The saved order, as read back from the database — the only source of the message. */
export type NotifiedOrder = {
  id: string;
  number: string;
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  location: { name: string; address: string } | null;
  paymentMethod: PaymentMethod;
  paymentBank: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  demo: boolean | null;
  items: { productName: string; quantity: number; price: number; total: number; options: { name: string; price: number }[] }[];
};

const PAYMENT: Record<PaymentMethod, string> = {
  CASH: "Наличными при получении",
  CARD_ON_DELIVERY: "Картой при получении",
  CARD_ONLINE: "Картой онлайн",
};

/** Telegram refuses messages over 4096 characters. */
const MAX_LENGTH = 4096;

const lei = (bani: number) => formatPrice(bani, "ru");

const dateTime = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Chisinau",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Builds the HTML message for a new order (Telegram HTML mode). Every customer value is escaped. */
export function formatOrderMessage(order: NotifiedOrder, adminUrl: string): string {
  const head = [
    "🍔 <b>НОВЫЙ ЗАКАЗ — FASTBURGERS</b>",
    ...(order.demo ? ["🧪 <i>Демо-заказ: сайт работает в режиме ORDER_MODE=demo</i>"] : []),
    "",
    `<b>Номер:</b> ${esc(order.number)}`,
    `<b>Дата:</b> ${dateTime.format(order.createdAt)}`,
    `<b>Клиент:</b> ${esc(order.customerName)}`,
    `<b>Телефон:</b> ${esc(order.customerPhone)}`,
  ];
  if (order.deliveryMethod === "DELIVERY") {
    head.push("<b>Получение:</b> доставка");
    if (order.deliveryAddress) head.push(`<b>Адрес:</b> ${esc(order.deliveryAddress)}`);
  } else {
    head.push("<b>Получение:</b> самовывоз");
    if (order.location) head.push(`<b>Ресторан:</b> ${esc(order.location.name)}, ${esc(order.location.address)}`);
  }
  const bank = paymentBankName(order.paymentBank, "другой банк");
  head.push(`<b>Оплата:</b> ${PAYMENT[order.paymentMethod]}${bank ? ` · ${esc(bank)}` : ""}`);
  // Nothing is charged on the site: online orders wait for the payment link the staff send.
  if (order.paymentMethod === "CARD_ONLINE") head.push("⚠️ <b>Не оплачено</b> — отправьте клиенту ссылку на оплату");
  head.push("", "<b>Состав заказа:</b>");

  const lines = order.items.map((item, i) => {
    const row = [`${i + 1}. ${esc(item.productName)} × ${item.quantity} — ${lei(item.total)}`];
    for (const option of item.options) {
      row.push(`    + ${esc(option.name)}${option.price ? ` (+${lei(option.price)})` : ""}`);
    }
    if (item.quantity > 1) row.push(`    <i>${lei(item.price)} за шт.</i>`);
    return row.join("\n");
  });

  const tail = ["", `<b>Товары:</b> ${lei(order.subtotal)}`];
  if (order.deliveryMethod === "DELIVERY") {
    tail.push(`<b>Доставка:</b> ${order.deliveryFee > 0 ? lei(order.deliveryFee) : "бесплатно"}`);
  }
  tail.push(`<b>Итого: ${lei(order.total)} (MDL)</b>`);
  if (order.notes?.trim()) tail.push("", `<b>Комментарий:</b> ${esc(order.notes.trim())}`);
  tail.push("", `<a href="${esc(adminUrl)}">Открыть заказ в админке</a>`);

  // Very long orders: keep the header, totals and link, shorten the list of items.
  const build = (shown: string[], hidden: number) =>
    [...head, ...shown, ...(hidden ? [`… и ещё ${hidden} поз. — полный состав в админке`] : []), ...tail].join("\n");
  let shown = lines;
  let message = build(shown, 0);
  while (message.length > MAX_LENGTH && shown.length > 1) {
    shown = shown.slice(0, -1);
    message = build(shown, lines.length - shown.length);
  }
  return message;
}

type Send = (html: string) => Promise<TelegramResult>;

const notNotified = { OR: [{ telegramNotifiedAt: null }, { telegramNotifiedAt: { isSet: false } }] };

/**
 * Sends the "new order" message for a saved order, at most once per order. The order is first
 * marked as notified with an atomic conditional update, so a replayed checkout (same attempt key →
 * same order) or a parallel call cannot send a second message. When Telegram fails the mark is
 * removed again, so a later call may retry. Never throws: the order is already saved and stays so.
 */
export async function notifyNewOrder(orderId: string, send: Send = sendTelegramMessage): Promise<"sent" | "skipped" | "failed"> {
  if (send === sendTelegramMessage && !telegramEnabled()) return "skipped";
  try {
    const claimed = await prisma.order.updateMany({ where: { id: orderId, ...notNotified }, data: { telegramNotifiedAt: new Date() } });
    if (claimed.count === 0) return "skipped"; // unknown order or already notified

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        number: true,
        createdAt: true,
        customerName: true,
        customerPhone: true,
        deliveryMethod: true,
        deliveryAddress: true,
        location: { select: { name: true, address: true } },
        paymentMethod: true,
        paymentBank: true,
        subtotal: true,
        deliveryFee: true,
        total: true,
        notes: true,
        demo: true,
        items: { select: { productName: true, quantity: true, price: true, total: true, options: true }, orderBy: { id: "asc" } },
      },
    });
    if (!order) return "skipped";

    const result = await send(formatOrderMessage(order, absoluteUrl(`/admin/orders/${order.id}`)));
    if (result.ok) return "sent";

    // Only the order number and Telegram's reason are logged: no token, no customer data.
    console.error(`Telegram notification for order ${order.number} failed: ${result.reason}`);
    await prisma.order.update({ where: { id: orderId }, data: { telegramNotifiedAt: null } }).catch(() => {});
    return "failed";
  } catch (error) {
    console.error("Telegram notification failed:", error instanceof Error ? error.name : "unknown error");
    await prisma.order.updateMany({ where: { id: orderId }, data: { telegramNotifiedAt: null } }).catch(() => {});
    return "failed";
  }
}
