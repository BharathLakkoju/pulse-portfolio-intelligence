import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { SubNav } from "@/components/shell/SubNav";
import { Card, Badge } from "@/components/ui/Card";

const ALERT_TYPES = ["drift", "price_move", "dividend", "stale_sync", "missing_cost_basis", "concentration", "drawdown", "connection_expiry", "balance_mismatch"];

export default async function AlertsSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const rules = await db.alertRule.findMany({ where: { userId: user.id } });

  return (
    <div className="max-w-2xl space-y-6">
      <SubNav
        items={[
          { href: "/settings/profile", label: "Profile" },
          { href: "/settings/alerts", label: "Alerts" },
          { href: "/settings/billing", label: "Billing" },
          { href: "/settings/privacy", label: "Privacy & data" },
        ]}
        activeHref="/settings/alerts"
      />
      <h1 className="text-xl font-semibold">Alert rules</h1>
      <p className="text-sm text-pulse-muted">Every alert explains why it fired and links to the underlying data. Digest is the default for low-urgency insights.</p>

      <Card title="Add a rule">
        <form action="/api/alert-rules" method="post" className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <select name="type" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm">
            {ALERT_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
          <input name="thresholdValue" placeholder="Threshold %" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" />
          <select name="channel" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm">
            <option value="in_app">In-app</option>
            <option value="email">Email</option>
          </select>
          <select name="frequencyCap" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm">
            <option value="realtime">Real-time</option>
            <option value="daily_digest">Daily digest</option>
            <option value="weekly_digest">Weekly digest</option>
          </select>
          <button type="submit" className="col-span-2 rounded-lg bg-pulse-accent px-3 py-1.5 text-sm font-medium text-white md:col-span-4">Add rule</button>
        </form>
      </Card>

      <Card title="Your rules">
        {rules.length === 0 ? (
          <p className="text-sm text-pulse-muted">No custom rules yet — default portfolio health checks still run.</p>
        ) : (
          <ul className="divide-y divide-pulse-border text-sm">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span className="capitalize">{r.type.replace("_", " ")} {r.thresholdValue ? `(${r.thresholdValue}%)` : ""}</span>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{r.channel}</Badge>
                  <Badge tone="neutral">{r.frequencyCap.replace("_", " ")}</Badge>
                  <form action={`/api/alert-rules/${r.id}/delete`} method="post">
                    <button type="submit" className="text-xs text-pulse-bad hover:underline">Remove</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
