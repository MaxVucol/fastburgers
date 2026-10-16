import "server-only";
import type { OrderStatus } from "@prisma/client";
import { adminNewOrderEmail, orderReceivedEmail, orderStatusEmail } from "@/lib/email/templates";
import { EMAILED_STATUSES, type EmailedStatus } from "@/lib/email/strings";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { isValidEmail, sendMail, type MailMessage, type SendResult } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { outboundChannelsClosed } from "@/lib/preview-guard.mjs";

/**
 * E-mails about orders: "order received" to the customer, "new order" to the owner
 * (ADMIN_NOTIFY_EMAIL) and status updates to the customer.
 *
 * They run after the order is saved (from `after()`), never before: a mail failure cannot undo or
 * block an order, and they are independent of the Telegram message. Each e-mail is first claimed
 * with an atomic conditional update on the order (like the Telegram notification), so a replayed
 * checkout, a double click or two servers cannot send it twice; if sending fails the claim is
 * released so a later call may try again. Never throws. Logs only the order number and a short
 * reason — no addresses, no content.
 *
 * Demo orders (placed while ORDER_MODE ≠ "live", stored with `demo: true`) never e-mail the
 * customer: they are skipped before any claim is written, so nothing is recorded for them, and
 * since the flag stays on the order, switching to live mode later sends nothing for old demo
 * orders. The owner still gets their e-mail, marked as a demo order.
 */

type Send = (message: MailMessage) => Promise<SendResult>;
export type EmailOutcome = "sent" | "skipped" | "failed";

const orderSelect = {
  id: true,
  number: true,
  status: true,
  locale: true,
  emailedStatus: true,
  customerName: true,
  customerEmail: true,
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
  items: { select: { productName: true, quantity: true, total: true, options: true }, orderBy: { id: "asc" as const } },
} as const;

const unset = (field: "customerEmailedAt" | "adminEmailedAt" | "emailedStatus") => ({ OR: [{ [field]: null }, { [field]: { isSet: false } }] });

const orderLocale = (value: string | null): Locale => (isLocale(value) ? value : defaultLocale);

/** Whether the customer of this order may get e-mails: a real (non-demo) order with a plausible address. */
export function customerMayBeEmailed(order: { demo: boolean | null; customerEmail: string }) {
  return order.demo !== true && isValidEmail(order.customerEmail);
}

export function adminNotifyEmail(env: Record<string, string | undefined> = process.env): string | null {
  const value = env.ADMIN_NOTIFY_EMAIL?.trim() ?? "";
  return isValidEmail(value) ? value : null;
}

/** Claims `field` (set to now while unset), sends, and releases the claim on failure. */
async function sendOnce(
  orderId: string,
  field: "customerEmailedAt" | "adminEmailedAt",
  number: string,
  label: string,
  message: MailMessage,
  send: Send,
): Promise<EmailOutcome> {
  const claimed = await prisma.order.updateMany({ where: { id: orderId, ...unset(field) }, data: { [field]: new Date() } });
  if (claimed.count === 0) return "skipped"; // already sent (or being sent)
  const result = await send(message).catch((): SendResult => ({ ok: false, reason: "exception" }));
  if (result.ok) return "sent";
  console.error(`Order e-mail (${label}) for ${number} failed: ${result.reason}`);
  await prisma.order.updateMany({ where: { id: orderId }, data: { [field]: null } }).catch(() => {});
  return "failed";
}

/** "Order received" to the customer and "new order" to the owner. Both independent. */
export async function sendNewOrderEmails(orderId: string, send: Send = sendMail, adminEmail: string | null = adminNotifyEmail()) {
  const outcome: { customer: EmailOutcome; admin: EmailOutcome } = { customer: "skipped", admin: "skipped" };
  if (outboundChannelsClosed()) return outcome; // Preview: nothing is sent and nothing is claimed in the database
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: orderSelect });
    if (!order) return outcome;
    // Demo orders, and addresses that are missing or not plausible, get no customer e-mail.
    if (customerMayBeEmailed(order)) {
      outcome.customer = await sendOnce(order.id, "customerEmailedAt", order.number, "customer", orderReceivedEmail(order, orderLocale(order.locale)), send);
    }
    if (adminEmail) {
      outcome.admin = await sendOnce(order.id, "adminEmailedAt", order.number, "admin", adminNewOrderEmail(order, adminEmail), send);
    }
  } catch (error) {
    console.error("Order e-mails failed:", error instanceof Error ? error.name : "unknown error");
    if (outcome.customer === "skipped") outcome.customer = "failed";
  }
  return outcome;
}

export function isEmailedStatus(status: OrderStatus): status is EmailedStatus {
  return (EMAILED_STATUSES as readonly OrderStatus[]).includes(status);
}

/**
 * Tells the customer that the order reached `status` — only for the statuses worth an e-mail, only
 * while the order is still in it, and at most once per status (a repeated or parallel call is
 * skipped by the compare-and-set on `emailedStatus`).
 */
export async function sendOrderStatusEmail(orderId: string, status: OrderStatus, send: Send = sendMail): Promise<EmailOutcome> {
  if (!isEmailedStatus(status) || outboundChannelsClosed()) return "skipped";
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: orderSelect });
    if (!order || order.status !== status || order.emailedStatus === status || !customerMayBeEmailed(order)) return "skipped";
    const previous = order.emailedStatus;
    const claimed = await prisma.order.updateMany({
      where: { id: orderId, status, ...(previous ? { emailedStatus: previous } : unset("emailedStatus")) },
      data: { emailedStatus: status },
    });
    if (claimed.count === 0) return "skipped";
    const result = await send(orderStatusEmail(order, status, orderLocale(order.locale))).catch((): SendResult => ({ ok: false, reason: "exception" }));
    if (result.ok) return "sent";
    console.error(`Order e-mail (status ${status}) for ${order.number} failed: ${result.reason}`);
    await prisma.order.updateMany({ where: { id: orderId, emailedStatus: status }, data: { emailedStatus: previous } }).catch(() => {});
    return "failed";
  } catch (error) {
    console.error("Order status e-mail failed:", error instanceof Error ? error.name : "unknown error");
    return "failed";
  }
}
