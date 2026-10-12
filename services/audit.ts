import "server-only";
import { prisma } from "@/lib/prisma";

export type AuditActor = { id: string; email: string };

/**
 * Records an administrative action. `summary` is human-readable and must never contain
 * passwords, tokens, hashes or payment data — only what changed (e.g. "Preț: 32,90 → 89,00").
 * A failure to write the log never blocks the action itself.
 */
export async function audit(actor: AuditActor, action: string, entity: string, entityId: string | null, summary: string) {
  try {
    await prisma.auditLog.create({
      data: { actorId: actor.id, actorEmail: actor.email, action, entity, entityId, summary: summary.slice(0, 500) },
    });
  } catch (error) {
    console.error("audit log write failed", action, entity, error instanceof Error ? error.message : "");
  }
}

export async function listAudit(filters: { entity?: string; entityId?: string; take?: number } = {}) {
  return prisma.auditLog.findMany({
    where: { entity: filters.entity || undefined, entityId: filters.entityId || undefined },
    orderBy: { createdAt: "desc" },
    take: filters.take ?? 100,
  });
}
