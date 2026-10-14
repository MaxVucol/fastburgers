// Card payment needs a bank (chosen in the checkout dialog); cash does not.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { paymentBankName } from "@/lib/payment-banks";
import { checkoutSchema } from "@/lib/validation/checkout";

const base = {
  customerName: "Ana Pop",
  customerPhone: "069123456",
  customerEmail: "ana@example.com",
  deliveryMethod: "DELIVERY",
  deliveryAddress: "Str. Test 1, ap. 2",
  items: [{ productId: "665f00000000000000000001", quantity: 1, optionIds: [] }],
};

describe("payment method and bank", () => {
  test("cash: no bank needed", () => {
    assert.equal(checkoutSchema.safeParse({ ...base, paymentMethod: "CASH" }).success, true);
  });

  for (const method of ["CARD_ON_DELIVERY", "CARD_ONLINE"]) {
    test(`${method}: refused without a bank, accepted with one`, () => {
      const missing = checkoutSchema.safeParse({ ...base, paymentMethod: method });
      assert.equal(missing.success, false);
      assert.ok(!missing.success && missing.error.issues.some((i) => i.path[0] === "paymentBank" && i.message === "bank"));
      assert.equal(checkoutSchema.safeParse({ ...base, paymentMethod: method, paymentBank: "maib" }).success, true);
    });
  }

  test("unknown banks are refused", () => {
    assert.equal(checkoutSchema.safeParse({ ...base, paymentMethod: "CARD_ONLINE", paymentBank: "fakebank" }).success, false);
  });

  test("display names", () => {
    assert.equal(paymentBankName("micb", "Другой банк"), "Moldindconbank");
    assert.equal(paymentBankName("other", "Другой банк"), "Другой банк");
    assert.equal(paymentBankName(null, "x"), null);
  });
});
