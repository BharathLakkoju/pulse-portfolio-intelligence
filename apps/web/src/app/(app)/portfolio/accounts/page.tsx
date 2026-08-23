import { redirect } from "next/navigation";
import Link from "next/link";
import Decimal from "decimal.js";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { computePositions, groupBy } from "@/lib/portfolio";
import { db } from "@/lib/db";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { SubNav } from "@/components/shell/SubNav";
import { Card, Badge } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/format";

const STATUS_TONE: Record<string, "good" | "warn" | "bad" | "neutral"> = {
  healthy: "good",
  delayed: "neutral",
  reconnect_required: "warn",
  partial_data: "warn",
  failed: "bad",
  retired: "neutral",
};

export default async function AccountsPage({ searchParams }: { searchParams: { portfolio?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const accounts = await db.account.findMany({ where: { portfolioId: active.id }, orderBy: { connectedAt: "asc" } });
  const positions = await computePositions(active.id);
  const byAccount = groupBy(positions, (p) => p.accountId);

  return (
    <div className="space-y-6">
      <SubNav
        items={[
          { href: "/portfolio/holdings", label: "Holdings" },
          { href: "/portfolio/accounts", label: "Accounts" },
          { href: "/portfolio/transactions", label: "Transactions" },
        ]}
        activeHref="/portfolio/accounts"
        portfolioId={active.id}
      />
      <PortfolioHeader title="Accounts" subtitle={`${accounts.length} account(s) in ${active.name}`} portfolios={portfolios} activeId={active.id} action={<Link href="/connections" className="rounded-lg bg-pulse-accent px-3 py-1.5 text-xs font-medium text-white">Manage connections →</Link>} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {accounts.map((acc) => {
          const rows = byAccount[acc.id] ?? [];
          const value = rows.reduce((s, r) => s.plus(r.currentValue), new Decimal(0));
          return (
            <Card key={acc.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-pulse-text">{acc.name}</p>
                  <p className="text-xs text-pulse-muted capitalize">{acc.sourceType.replace("_", " ")} · {acc.provider}</p>
                </div>
                <Badge tone={STATUS_TONE[acc.status] ?? "neutral"}>{acc.status.replace("_", " ")}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-pulse-muted">Value</span>
                <span className="font-medium">{formatMoney(value, active.baseCurrency)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-pulse-muted">
                <span>Read-only{acc.isReadOnly ? " ✓" : " (unexpected)"}</span>
                <span>{acc.lastSyncAt ? `Synced ${formatDate(acc.lastSyncAt)}` : "Never synced"}</span>
              </div>
              {acc.isDemo && <p className="mt-2 text-xs text-pulse-warn">DEMO CONNECTION — simulated data, not a real brokerage link.</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
