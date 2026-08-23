import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listSessions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubNav } from "@/components/shell/SubNav";
import { Card, Badge } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";

export default async function PrivacySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const sessions = await listSessions(user.id);
  const auditLogs = await db.auditLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <div className="max-w-3xl space-y-6">
      <SubNav
        items={[
          { href: "/settings/profile", label: "Profile" },
          { href: "/settings/alerts", label: "Alerts" },
          { href: "/settings/billing", label: "Billing" },
          { href: "/settings/privacy", label: "Privacy & data" },
        ]}
        activeHref="/settings/privacy"
      />
      <h1 className="text-xl font-semibold">Privacy & data controls</h1>

      <Card title="Sessions & devices">
        <table className="w-full text-sm">
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-pulse-border/50">
                <td className="py-1.5 pr-3">{s.device ?? "web"}</td>
                <td className="py-1.5 pr-3 text-pulse-muted">Created {formatDate(s.createdAt)} · expires {formatDate(s.expiresAt)}</td>
                <td className="py-1.5 pr-3">{s.revokedAt ? <Badge tone="neutral">Revoked</Badge> : <Badge tone="good">Active</Badge>}</td>
                <td className="py-1.5 pr-3">
                  {!s.revokedAt && (
                    <form action={`/api/settings/sessions/${s.id}/revoke`} method="post">
                      <button type="submit" className="text-xs text-pulse-bad hover:underline">Revoke</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Export & delete your data">
        <div className="flex flex-wrap gap-2">
          <a href="/api/settings/export" className="rounded-lg border border-pulse-border px-3 py-2 text-sm hover:bg-pulse-surfaceAlt">Export all data (JSON)</a>
          <form action="/api/settings/delete" method="post">
            <button type="submit" className="rounded-lg border border-pulse-bad/40 px-3 py-2 text-sm text-pulse-bad hover:bg-pulse-bad/10">Delete my account</button>
          </form>
        </div>
        <p className="mt-2 text-xs text-pulse-muted">Deleting your account permanently removes your portfolios, transactions, and connections. This cannot be undone.</p>
      </Card>

      <Card title="Audit log">
        <div className="max-h-[400px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-pulse-surface">
              <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                <th className="py-1.5 pr-3">When</th>
                <th className="py-1.5 pr-3">Event</th>
                <th className="py-1.5 pr-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((l) => (
                <tr key={l.id} className="border-b border-pulse-border/50">
                  <td className="py-1.5 pr-3">{formatDate(l.createdAt, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="py-1.5 pr-3">{l.eventType.replace("_", " ")}</td>
                  <td className="py-1.5 pr-3 text-pulse-muted">{l.detailJson}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
