// Child process for tests/preview-prisma.test.ts: calls real write (and read) operations of the app's services with the
// environment the parent gave it and prints, per operation, whether the Preview guard refused it. Never prints a value
// from the environment. The database address in these tests is unreachable (127.0.0.1:1), so an operation that is not
// refused fails quickly with a connection error instead of touching anything.
process.env.AUTH_SECRET ??= "unit-test-secret-unit-test-secret-0123";

if (process.env.PARK_GLOBAL_CLIENT) {
  // A client left on globalThis (development hot reload) must never be picked up by a Preview.
  const { PrismaClient } = await import("@prisma/client");
  globalThis.prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL, log: [] });
}

const { prisma, PreviewDatabaseBlockedError } = await import("@/lib/prisma");
const { registerCustomer } = await import("@/services/accounts");
const { toggleFavorite, addAddress } = await import("@/services/customer");
const { listProductsAdmin } = await import("@/services/admin-catalog");
const { consume, RATE_LIMITS } = await import("@/lib/rate-limit");

const id = "0123456789abcdef01234567";
const operations = {
  "register account (user create)": () => registerCustomer({ name: "Test", email: "t@example.test", password: "Test-password-1!x", phone: null }),
  "toggle favourite (write)": () => toggleFavorite(id, id),
  "add address (write)": () => addAddress(id, { label: "Home", address: "Str. Test 1" }),
  "rate-limit counter (raw command write)": () => consume(RATE_LIMITS.lookupIp, "203.0.113.9"),
  "admin catalogue list (read)": () => listProductsAdmin({}),
  "direct model write": () => prisma.review.create({ data: { name: "x", rating: 5, text: "x" } }),
  "direct raw command": () => prisma.$runCommandRaw({ ping: 1 }),
  "direct transaction": () => prisma.$transaction([prisma.review.deleteMany({ where: { name: "never-exists-x" } })]),
  "direct connect": () => prisma.$connect(),
};

const results = [];
for (const [name, run] of Object.entries(operations)) {
  try {
    await run();
    results.push({ name, refused: false, error: null });
  } catch (error) {
    results.push({ name, refused: error instanceof PreviewDatabaseBlockedError, error: error instanceof Error ? error.name : "unknown" });
  }
}
console.log(`RESULT ${JSON.stringify(results)}`);
await prisma.$disconnect();
process.exit(0);
