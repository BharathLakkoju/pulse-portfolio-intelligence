import { db } from "./db";

export type AuditEventType =
  | "sign_in"
  | "sign_out"
  | "export"
  | "connection_change"
  | "admin_access"
  | "billing_event"
  | "data_deletion"
  | "consent_change";

export async function writeAuditLog(userId: string | null, eventType: AuditEventType, detail: Record<string, unknown> = {}) {
  await db.auditLog.create({
    data: {
      userId: userId ?? undefined,
      eventType,
      detailJson: JSON.stringify(detail),
    },
  });
}
