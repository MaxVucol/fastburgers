import type { DeliveryMethod, PaymentMethod } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { fill, localizePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { paymentBankName } from "@/lib/payment-banks";
import { absoluteUrl } from "@/lib/site";
import { renderEmail, type EmailBlock } from "./layout";
import { mailStrings, type EmailedStatus } from "./strings";

/** Every builder returns { to, subject, text, html }: ready for sendMail. */

/** A message with one action link (e-mail confirmation, password reset, new address). */
export function linkEmail(locale: Locale, to: string, copy: { subject: string; heading?: string; intro: string; button: string; outro: string }, link: string) {
  return renderEmail(
    {
      lang: locale,
      subject: copy.subject,
      preheader: copy.intro,
      heading: copy.heading ?? copy.subject,
      blocks: [
        { kind: "p", text: copy.intro },
        { kind: "button", label: copy.button, url: link },
        { kind: "muted", text: copy.outro },
      ],
      footer: mailStrings[locale].footer,
    },
    to,
  );
}

/** A security notice without a link (e-mail change requested, Google connected). */
export function noticeEmail(locale: Locale, to: string, copy: { subject: string; heading: string; intro: string; outro: string }) {
  return renderEmail(
    {
      lang: locale,
      subject: copy.subject,
      preheader: copy.intro,
      heading: copy.heading,
      blocks: [
        { kind: "p", text: copy.intro },
        { kind: "muted", text: copy.outro },
      ],
      footer: mailStrings[locale].footer,
    },
    to,
  );
}

/** The saved order, as read back from the database — the only source of order e-mails. */
export type EmailOrder = {
  number: string;
  customerName: string;
  customerEmail: string;
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
  items: { productName: string; quantity: number; total: number; options: { name: string }[] }[];
};

function itemLines(order: EmailOrder, locale: Locale) {
  const t = getDictionary(locale);
  return order.items.map((item) => {
    const options = item.options.map((o) => t.options[o.name] ?? o.name);
    return `${item.quantity} × ${item.productName}${options.length ? ` (${options.join(", ")})` : ""} — ${formatPrice(item.total, locale)}`;
  });
}

function detailRows(order: EmailOrder, locale: Locale) {
  const t = getDictionary(locale);
  const s = mailStrings[locale].order;
  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: s.number, value: order.number, strong: true },
    { label: s.method, value: t.order.methods[order.deliveryMethod] },
  ];
  if (order.deliveryMethod === "DELIVERY" && order.deliveryAddress) rows.push({ label: s.address, value: order.deliveryAddress });
  if (order.deliveryMethod === "PICKUP" && order.location) rows.push({ label: s.restaurant, value: `${order.location.name}, ${order.location.address}` });
  const bank = paymentBankName(order.paymentBank, t.checkout.bankOther);
  rows.push({ label: s.payment, value: `${t.order.payments[order.paymentMethod]}${bank ? ` · ${bank}` : ""}` });
  rows.push({ label: s.subtotal, value: formatPrice(order.subtotal, locale) });
  if (order.deliveryMethod === "DELIVERY") rows.push({ label: s.delivery, value: order.deliveryFee > 0 ? formatPrice(order.deliveryFee, locale) : s.free });
  rows.push({ label: s.total, value: formatPrice(order.total, locale), strong: true });
  return rows;
}

const trackUrl = (order: EmailOrder, locale: Locale) => absoluteUrl(localizePath(locale, `/order/${order.number}`));

/** To the customer, once a real (non-demo) order is saved. */
export function orderReceivedEmail(order: EmailOrder, locale: Locale) {
  const s = mailStrings[locale].order;
  const blocks: EmailBlock[] = [{ kind: "p", text: s.intro }, { kind: "rows", rows: detailRows(order, locale) }];
  if (order.paymentMethod === "CARD_ONLINE") blocks.push({ kind: "p", text: s.onlinePending });
  blocks.push({ kind: "p", text: s.items }, { kind: "list", items: itemLines(order, locale) }, { kind: "button", label: s.track, url: trackUrl(order, locale) });
  return renderEmail(
    {
      lang: locale,
      subject: fill(s.subject, { number: order.number }),
      preheader: fill(s.subject, { number: order.number }),
      heading: fill(s.heading, { name: order.customerName.split(" ")[0] || order.customerName }),
      blocks,
      footer: mailStrings[locale].footer,
    },
    order.customerEmail,
  );
}

/** To the customer, when the order reaches one of the EMAILED_STATUSES. */
export function orderStatusEmail(order: EmailOrder, status: EmailedStatus, locale: Locale) {
  const s = mailStrings[locale].status;
  const statusLabel = getDictionary(locale).order.statuses[status];
  const heading = fill(s[status].heading, { number: order.number });
  return renderEmail(
    {
      lang: locale,
      subject: fill(s.subject, { number: order.number, status: statusLabel }),
      preheader: s[status].text,
      heading,
      blocks: [
        { kind: "p", text: s[status].text },
        { kind: "rows", rows: detailRows(order, locale) },
        { kind: "button", label: s.track, url: trackUrl(order, locale) },
      ],
      footer: mailStrings[locale].footer,
    },
    order.customerEmail,
  );
}

/** To the owner (Russian, like the Telegram message), for every new order. */
export function adminNewOrderEmail(order: EmailOrder & { id: string }, to: string) {
  const locale: Locale = "ru";
  const rows = detailRows(order, locale);
  rows.splice(1, 0, { label: "Клиент", value: order.customerName }, { label: "Телефон", value: order.customerPhone }, { label: "Email", value: order.customerEmail });
  const blocks: EmailBlock[] = [];
  if (order.demo) blocks.push({ kind: "p", text: "⚠ ДЕМО-ЗАКАЗ: создан в режиме ORDER_MODE=demo, готовить не нужно. Клиенту письмо не отправлялось." });
  if (order.paymentMethod === "CARD_ONLINE") blocks.push({ kind: "p", text: "Не оплачено: отправьте клиенту ссылку на оплату." });
  blocks.push({ kind: "rows", rows }, { kind: "p", text: "Состав заказа" }, { kind: "list", items: itemLines(order, locale) });
  if (order.notes?.trim()) blocks.push({ kind: "p", text: `Комментарий: ${order.notes.trim()}` });
  blocks.push({ kind: "button", label: "Открыть заказ в админке", url: absoluteUrl(`/admin/orders/${order.id}`) });
  return renderEmail(
    {
      lang: locale,
      subject: `${order.demo ? "[демо] " : ""}Новый заказ ${order.number} — ${formatPrice(order.total, locale)}`,
      preheader: `${order.customerName}, ${formatPrice(order.total, locale)}`,
      heading: `Новый заказ ${order.number}`,
      blocks,
      footer: "Уведомление сайта BUNIQ для администратора.",
    },
    to,
  );
}
