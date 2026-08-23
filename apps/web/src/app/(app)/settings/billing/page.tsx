import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { PLANS } from "@pulse/shared-types";
import { SubNav } from "@/components/shell/SubNav";
import { Card, Badge } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/Disclaimer";
import { formatMoney, formatDate } from "@/lib/format";

export default async function BillingSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { plan, subscription } = await getEntitlements(user.id);
  const invoices = await db.invoice.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" } });

  return (
    <div className="max-w-3xl space-y-6">
      <SubNav
        items={[
          { href: "/settings/profile", label: "Profile" },
          { href: "/settings/alerts", label: "Alerts" },
          { href: "/settings/billing", label: "Billing" },
          { href: "/settings/privacy", label: "Privacy & data" },
        ]}
        activeHref="/settings/billing"
      />
      <h1 className="text-xl font-semibold">Billing</h1>

      <DemoBanner text="Billing runs in local TEST MODE — no real Razorpay account is connected and no card/UPI/bank details are ever collected. See QUESTIONS.md #6." />

      <Card title="Current plan">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{plan.name}</p>
            <p className="text-xs text-pulse-muted">Status: {subscription?.status ?? "active"} {subscription?.currentPeriodEnd ? `· renews ${formatDate(subscription.currentPeriodEnd)}` : ""}</p>
          </div>
          {subscription && subscription.planId !== "free" && (
            <form action="/api/billing/cancel" method="post">
              <button type="submit" className="rounded-lg border border-pulse-bad/40 px-3 py-1.5 text-xs text-pulse-bad hover:bg-pulse-bad/10">Cancel plan</button>
            </form>
          )}
        </div>
      </Card>

      <Card title="Plans">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.values(PLANS).map((p) => (
            <div key={p.id} className="rounded-lg border border-pulse-border p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{p.name}</p>
                {plan.id === p.id && <Badge tone="accent">Current</Badge>}
              </div>
              <p className="mt-1 text-sm text-pulse-muted">
                {p.priceMonthly ? `${formatMoney(p.priceMonthly.amount, p.priceMonthly.currency)}/mo` : "Free"}
              </p>
              <ul className="mt-2 space-y-0.5 text-xs text-pulse-muted">
                <li>Accounts: {p.maxAccounts}</li>
                <li>Connections: {p.maxConnections}</li>
                <li>Advanced risk: {p.advancedRisk ? "Yes" : "No"}</li>
                <li>Tax workspace: {p.taxWorkspace.replace("_", " ")}</li>
              </ul>
              {plan.id !== p.id && p.priceMonthly && (
                <form action="/api/billing/checkout" method="post" className="mt-3">
                  <input type="hidden" name="planId" value={p.id} />
                  <input type="hidden" name="interval" value="monthly" />
                  <button type="submit" className="w-full rounded-lg bg-pulse-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">Switch to {p.name}</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Invoices">
        {invoices.length === 0 ? (
          <p className="text-sm text-pulse-muted">No invoices yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                <th className="py-1.5 pr-3">Date</th>
                <th className="py-1.5 pr-3">Plan</th>
                <th className="py-1.5 pr-3">Amount</th>
                <th className="py-1.5 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-pulse-border/50">
                  <td className="py-1.5 pr-3">{formatDate(inv.issuedAt)}</td>
                  <td className="py-1.5 pr-3 capitalize">{inv.planId.replace("_", " ")}</td>
                  <td className="py-1.5 pr-3">{formatMoney(inv.amount, inv.currency)}</td>
                  <td className="py-1.5 pr-3"><Badge tone={inv.status === "paid" ? "good" : "neutral"}>{inv.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
