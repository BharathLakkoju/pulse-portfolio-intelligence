import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";

export default async function AlertsInboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const alerts = await db.alert.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Alert inbox</h1>
          <p className="text-sm text-pulse-muted">Every alert explains why it fired and links to the underlying data.</p>
        </div>
        <form action="/api/alerts/evaluate" method="post">
          <button type="submit" className="rounded-lg border border-pulse-border px-3 py-1.5 text-xs hover:bg-pulse-surfaceAlt">Re-check now</button>
        </form>
      </div>

      {alerts.length === 0 ? (
        <EmptyState title="No alerts yet" />
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.title}</p>
                    <Badge tone={a.severity === "critical" ? "bad" : a.severity === "warning" ? "warn" : "neutral"}>{a.severity}</Badge>
                    {!a.readAt && <Badge tone="accent">New</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-pulse-muted">{a.message}</p>
                  <p className="mt-1 text-xs text-pulse-muted">{formatDate(a.createdAt, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · type: {a.type}</p>
                </div>
                {!a.readAt && (
                  <form action={`/api/alerts/${a.id}/read`} method="post">
                    <button type="submit" className="whitespace-nowrap rounded-lg border border-pulse-border px-2 py-1 text-xs hover:bg-pulse-surfaceAlt">Mark read</button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
