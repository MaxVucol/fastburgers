// The database is unreachable while an order is placed: createOrder must fail (the action turns any
// non-OrderError into the generic "please try again" message) and must not report a success.
// Runs in its own process with a client pointed at a closed port; no database is touched.
import assert from "node:assert/strict";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";

test("database down: the order is rejected, not reported as placed", async () => {
  const dead = "mongodb://127.0.0.1:1/fastburgers_test?serverSelectionTimeoutMS=500&connectTimeoutMS=500";
  process.env.DATABASE_URL = dead;
  process.env.AUTH_SECRET ??= "integration-test-secret-0123456789abcd";
  // lib/prisma reuses a client parked on globalThis outside production.
  (globalThis as { prisma?: PrismaClient }).prisma = new PrismaClient({ datasourceUrl: dead });
  const { createOrder, OrderError } = await import("@/services/orders");
  const data = {
    customerName: "Test Client",
    customerPhone: "0721000000",
    customerEmail: "test@example.com",
    deliveryMethod: "DELIVERY" as const,
    deliveryAddress: "Str. Test 1, ap. 2",
    locationId: "",
    paymentMethod: "CASH" as const,
    notes: "",
    items: [{ productId: "0123456789abcdef01234567", quantity: 1, optionIds: [], unitPrice: 1000 }],
  };
  await assert.rejects(createOrder(data, { idempotencyKey: "0123456789abcdef-test" }), (error: unknown) => {
    assert.ok(!(error instanceof OrderError), "a database failure is not a customer-facing order error");
    return true;
  });
});
