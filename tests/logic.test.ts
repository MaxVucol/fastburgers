// Unit tests of pure logic (no database): order status transitions, account validation,
// safe redirects and CSV handling.
import assert from "node:assert/strict";
import { test } from "node:test";
import { canChangeStatus, nextStatuses } from "@/lib/order-status";
import { csvCell, parseCsv } from "@/lib/csv";
import { addressSchema, passwordSchema, registerSchema, safeNext } from "@/lib/validation/account";

test("order status: only forward steps, cancelled/completed are final", () => {
  assert.deepEqual(nextStatuses("NEW", "DELIVERY"), ["CONFIRMED", "CANCELLED"]);
  assert.equal(canChangeStatus("NEW", "COMPLETED", "DELIVERY"), false, "no skipping to completed");
  assert.equal(canChangeStatus("COMPLETED", "NEW", "PICKUP"), false);
  assert.deepEqual(nextStatuses("CANCELLED", "DELIVERY"), []);
  assert.equal(canChangeStatus("PREPARING", "OUT_FOR_DELIVERY", "PICKUP"), false, "pick-up orders are never out for delivery");
  assert.equal(canChangeStatus("READY", "COMPLETED", "DELIVERY"), false, "delivery is completed after the courier");
  assert.equal(canChangeStatus("READY", "COMPLETED", "PICKUP"), true);
  assert.equal(canChangeStatus("OUT_FOR_DELIVERY", "COMPLETED", "DELIVERY"), true);
});

test("passwords need 8+ characters with a letter and a digit", () => {
  assert.equal(passwordSchema.safeParse("short1").success, false);
  assert.equal(passwordSchema.safeParse("onlyletters").success, false);
  assert.equal(passwordSchema.safeParse("12345678").success, false);
  assert.equal(passwordSchema.safeParse("parolă123").success, true);
});

test("registration normalises the e-mail and validates the optional phone", () => {
  const ok = registerSchema.safeParse({ name: "Ion Popescu", email: " Ion@Example.COM ", phone: "", password: "parola123" });
  assert.ok(ok.success);
  assert.equal(ok.data.email, "ion@example.com");
  assert.equal(ok.data.phone, null);
  const phone = registerSchema.safeParse({ name: "Ion", email: "a@b.md", phone: "+373 (69) 123-456", password: "parola123" });
  assert.ok(phone.success);
  assert.equal(phone.data.phone, "+37369123456");
  assert.equal(registerSchema.safeParse({ name: "Ion", email: "a@b.md", phone: "abc", password: "parola123" }).success, false);
  assert.equal(addressSchema.safeParse({ label: "", address: "Str. Test 1" }).success, false);
});

test("sign-in only follows same-site paths", () => {
  assert.equal(safeNext("/ru/account/orders", "/account"), "/ru/account/orders");
  assert.equal(safeNext("//evil.example/x", "/account"), "/account");
  assert.equal(safeNext("https://evil.example", "/account"), "/account");
  assert.equal(safeNext("/\\evil.example", "/account"), "/account");
  assert.equal(safeNext(undefined, "/account"), "/account");
});

test("CSV: quotes, commas in fields, semicolon files and formula neutralising", () => {
  assert.deepEqual(parseCsv('a,b\n"x, y","say ""hi"""\n'), [["a", "b"], ["x, y", 'say "hi"']]);
  assert.deepEqual(parseCsv("a;b\r\n1;2\r\n"), [["a", "b"], ["1", "2"]]);
  assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(csvCell("a,b"), '"a,b"');
});
