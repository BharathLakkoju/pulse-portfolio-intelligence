import { redirect } from "next/navigation";
import Link from "next/link";
import Decimal from "decimal.js";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { computePositions, aggregateByInstrument, groupBy } from "@/lib/portfolio";
import { computeDriftReport } from "@/lib/risk";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { SubNav } from "@/components/shell/SubNav";
import { Card, Badge } from "@/components/ui/Card";
import { formatMoney, formatPct } from "@/lib/format";
import { AllocationChart } from "@/components/charts/AllocationChart";

export default async function AllocationPage({ searchParams }: { searchParams: { portfolio?: string; by?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const by = searchParams.by || "assetClass";
  const positions = await computePositions(active.id);
  const held = aggregateByInstrument(positions);
  const totalValue = held.reduce((s, p) => s.plus(p.currentValue), new Decimal(0));

  const keyFn = (p: (typeof held)[number]) =>
    by === "sector" ? p.sector || "Unclassified" : by === "geography" ? p.country : by === "currency" ? p.currency : by === "exchange" ? p.exchange : p.assetClass;
  const grouped = groupBy(held, keyFn);
  const rows = Object.entries(grouped)
    .map(([k, v]) => ({ key: k, value: v.reduce((s, r) => s.plus(r.currentValue), new Decimal(0)) }))
    .sort((a, b) => b.value.comparedTo(a.value));

  const drift = await computeDriftReport(active.id);

  return (
    <div className="space-y-6">
      <SubNav
        items={[
          { href: "/analyze/allocation", label: "Allocation" },
          { href: "/analyze/risk", label: "Risk" },
          { href: "/analyze/rebalance", label: "Rebalance" },
        ]}
        activeHref="/analyze/allocation"
        portfolioId={active.id}
      />
      <PortfolioHeader
        title="Allocation"
        subtitle="Where your value sits, and how it compares to target"
        portfolios={portfolios}
        activeId={active.id}
        action={
          <div className="flex gap-1">
            {["assetClass", "sector", "geography", "currency", "exchange"].map((g) => (
              <Link key={g} href={`/analyze/allocation?portfolio=${active.id}&by=${g}`} className={`rounded px-2 py-1 text-xs ${by === g ? "bg-pulse-accent text-white" : "border border-pulse-border text-pulse-muted hover:bg-pulse-surfaceAlt"}`}>
                {g === "assetClass" ? "Asset class" : g[0].toUpperCase() + g.slice(1)}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={`Weight by ${by === "assetClass" ? "asset class" : by}`}>
          {rows.length > 0 ? (
            <AllocationChart data={rows.map((r) => ({ name: r.key.replace("_", " "), value: r.value.toNumber() }))} />
          ) : (
            <p className="text-sm text-pulse-muted">No holdings yet.</p>
          )}
        </Card>
        <Card title="Breakdown">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                <th className="py-1.5 pr-3">Category</th>
                <th className="py-1.5 pr-3">Value</th>
                <th className="py-1.5 pr-3">Weight</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-pulse-border/50">
                  <td className="py-1.5 pr-3 capitalize">{r.key.replace("_", " ")}</td>
                  <td className="py-1.5 pr-3">{formatMoney(r.value, active.baseCurrency)}</td>
                  <td className="py-1.5 pr-3">{formatPct(totalValue.gt(0) ? r.value.dividedBy(totalValue).times(100).toNumber() : 0, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card title="Target vs actual (asset class)" action={<Link href="/analyze/rebalance" className="text-xs text-pulse-accent hover:underline">Edit targets & rebalance →</Link>}>
        {drift.length === 0 ? (
          <p className="text-sm text-pulse-muted">No target allocation set yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                <th className="py-1.5 pr-3">Category</th>
                <th className="py-1.5 pr-3">Actual</th>
                <th className="py-1.5 pr-3">Target</th>
                <th className="py-1.5 pr-3">Drift</th>
                <th className="py-1.5 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {drift.map((d) => (
                <tr key={d.category} className="border-b border-pulse-border/50">
                  <td className="py-1.5 pr-3 capitalize">{d.category.replace("_", " ")}</td>
                  <td className="py-1.5 pr-3">{formatPct(d.actualWeight * 100, 1)}</td>
                  <td className="py-1.5 pr-3">{formatPct(d.targetWeight * 100, 1)}</td>
                  <td className="py-1.5 pr-3">{formatPct(d.drift * 100, 1)}</td>
                  <td className="py-1.5 pr-3">{d.breachesThreshold ? <Badge tone="warn">Breach</Badge> : <Badge tone="good">OK</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
