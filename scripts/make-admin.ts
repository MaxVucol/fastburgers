// Gives an EXISTING account the administrator role (the project's own Role.ADMIN) — for when nobody
// can sign in to /admin yet to do it from "Utilizatori". Finds the user by e-mail only; never creates
// a user, never touches other accounts, orders, products or settings. Prints no password, hash or
// connection string.
//
//   npm run admin:grant -- you@example.com              → dry run (local database from .env)
//   npm run admin:grant -- you@example.com --apply      → applies it
//   npm run admin:grant:atlas -- you@example.com [--apply]   → same against the Atlas database (.env.atlas)
//
// Applying also ends the account's current sessions (as a role change in the admin panel does), so
// the next sign-in at /admin/login carries the new role. The change is written to the audit log.
import { PrismaClient } from "@prisma/client";

const apply = process.argv.includes("--apply");
const email = process.argv.slice(2).find((a) => !a.startsWith("--"))?.trim().toLowerCase() ?? "";
const prisma = new PrismaClient();

function databaseKind() {
  try {
    const host = new URL(process.env.DATABASE_URL ?? "").hostname;
    return host === "127.0.0.1" || host === "localhost" ? "local" : "remote";
  } catch {
    return "unknown";
  }
}

async function main() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Usage: npm run admin:grant -- you@example.com [--apply]");
    process.exitCode = 1;
    return;
  }
  console.log(`${apply ? "APPLY" : "DRY RUN"} · ${databaseKind()} database`);

  // E-mails are stored in lower case; a case-insensitive lookup also catches legacy spellings.
  const matches = await prisma.user.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, name: true, role: true, blockedAt: true, passwordHash: true },
  });
  if (matches.length === 0) {
    console.error(
      `✖ No account with the e-mail "${email}". Check the spelling (e.g. gmail.com, not email.com); ` +
        "if it is right, register on the site first (/ro/account/register), then run this again.",
    );
    process.exitCode = 1;
    return;
  }
  if (matches.length > 1) {
    console.error(`✖ ${matches.length} accounts match this e-mail in different letter case — nothing changed. Resolve it by hand.`);
    process.exitCode = 1;
    return;
  }

  const user = matches[0];
  console.log(`  account: ${user.email} · ${user.name} · role ${user.role}${user.blockedAt ? " · BLOCKED" : ""}`);
  if (!user.passwordHash) console.warn("! The account has no password, so it cannot sign in: set one via “Forgot password” first.");
  if (user.blockedAt) {
    console.error("✖ The account is blocked — nothing changed. Unblock it first (it would still be refused at sign-in).");
    process.exitCode = 1;
    return;
  }
  if (user.role === "ADMIN") {
    console.log("✔ Already an administrator — nothing to do. Sign in at /admin/login.");
    return;
  }
  if (!apply) {
    console.log("  Would set role CUSTOMER → ADMIN and end the account's sessions. Run again with --apply to do it.");
    return;
  }

  // A missing session version must be 0 before the increment (Prisma leaves null + 1 as null on
  // MongoDB, which would keep the account's existing sessions alive).
  await prisma.user.updateMany({
    where: { id: user.id, OR: [{ sessionVersion: null }, { sessionVersion: { isSet: false } }] },
    data: { sessionVersion: 0 },
  });
  // Conditional update: only this account, only if it is still a customer.
  const updated = await prisma.user.updateMany({
    where: { id: user.id, role: "CUSTOMER" },
    data: { role: "ADMIN", sessionVersion: { increment: 1 } },
  });
  if (updated.count !== 1) {
    console.error("✖ The account changed meanwhile — nothing applied. Run the dry run again.");
    process.exitCode = 1;
    return;
  }
  await prisma.auditLog.create({
    data: { actorId: null, actorEmail: "cli: scripts/make-admin.ts", action: "user.role", entity: "user", entityId: user.id, summary: `${user.email}: CUSTOMER → ADMIN` },
  });
  console.log("✔ Done: the account is now an administrator. Sign in at /admin/login with its e-mail and password.");
}

main()
  .catch((error) => {
    console.error("✖ Failed:", error instanceof Error ? error.name : "unknown error");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
