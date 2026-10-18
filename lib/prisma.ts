import "server-only";
import { PrismaClient } from "@prisma/client";
import { checkPreviewDatabase, isPreviewDeployment } from "@/lib/preview-guard.mjs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Thrown by every database operation of a Preview deployment that is not on the Preview database. Holds no connection data. */
export class PreviewDatabaseBlockedError extends Error {
  constructor() {
    super("Database access refused: this Preview deployment is not configured with the separate Preview database.");
    this.name = "PreviewDatabaseBlockedError";
  }
}

/** Properties that tooling probes on any object (await, JSON, React/RSC serialisation): answered without raising. */
const PROBED = new Set(["then", "toJSON", "$$typeof", "nodeType", "asymmetricMatch"]);

/**
 * Stands in for the client on a misconfigured Preview. No PrismaClient is created, so no connection to any
 * database is ever opened; every model (`prisma.order…`), `$transaction`, `$runCommandRaw`, `$queryRaw` and
 * `$connect` raises PreviewDatabaseBlockedError at the first touch. (`$disconnect` is a no-op.)
 */
function blockedClient(): PrismaClient {
  let reported = false;
  return new Proxy(
    {},
    {
      get(_target, property) {
        if (typeof property === "symbol" || PROBED.has(property)) return undefined;
        if (property === "$disconnect") return async () => {};
        if (!reported) {
          reported = true;
          console.error("Database access refused: this Preview deployment is not on the separate Preview database (fastburgers_preview).");
        }
        throw new PreviewDatabaseBlockedError();
      },
    },
  ) as PrismaClient;
}

/**
 * The one place the app builds its database client (every service and action imports `prisma` from here).
 *
 * On a Vercel Preview (VERCEL_ENV=preview) the client exists only when DATABASE_URL names exactly the database
 * `fastburgers_preview` (lib/preview-guard.mjs); otherwise every operation is refused, whatever the build did.
 * The checked value is also the one Prisma is given, so what is checked is what is used. Production and local
 * development are unchanged.
 */
export function createPrismaClient(env: Record<string, string | undefined> = process.env): PrismaClient {
  const log: ("warn" | "error")[] = env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];
  if (!isPreviewDeployment(env)) return new PrismaClient({ log });
  if (!checkPreviewDatabase(env).ok) return blockedClient();
  return new PrismaClient({ log, datasourceUrl: env.DATABASE_URL });
}

// A Preview never reuses a client parked on globalThis (development only): it is always built from the checked environment.
export const prisma = isPreviewDeployment() ? createPrismaClient() : (globalForPrisma.prisma ?? createPrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
