import { redirect } from "next/navigation";
import Decimal from "decimal.js";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { db } from "@/lib/db";
import { computePositions, aggregateByInstrument, groupBy } from "@/lib/portfolio";
import { computeDriftReport } from "@/lib/risk";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { SubNav } from "@/components/shell/SubNav";
import { Card, Badge } from "@/components/ui/Card";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { formatMoney, formatPct } from "@/lib/format";

const ASSET_CLASSES = ["equity", "etf", "mutual_fund", "crypto", "cash", "fixed_deposit", "bond", "gold", "real_estate", "other"];

export default async function RebalancePage({ searchParams }: { searchParams: { portfolio?: string; contribution?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const targets = await db.targetAllocation.findMany({ where: { portfolioId: active.id } });
  const targetMap = new Map(targets.map((t) => [t.category, t.targetWeight]));
  const drift = await computeDriftReport(active.id);

  const positions = await computePositions(active.id);
  const held = aggregateByInstrument(positions);
  const totalValue = held.reduce((s, p) => s.plus(p.currentValue), new Decimal(0));
  const byCategory = groupBy(held, (p) => p.assetClass);

  const contribution = new Decimal(searchParams.contribution || "0");
  const newTotal = totalValue.plus(contribution);

  const suggestions = drift
    .filter((d) => d.drift < 0)
    .map((d) => {
      const targetValue = newTotal.times(d.targetWeight);
      const currentValue = byCategory[d.category]?.reduce((s, p) => s.plus(p.currentValue), new Decimal(0)) ?? new Decimal(0);
      const gap = targetValue.minus(currentValue);
      return { category: d.category, gap: Decimal.max(gap, 0) };
    })
    .filter((s) => s.gap.gt(0))
    .sort((a, b) => b.gap.comparedTo(a.gap));

  const totalGap = suggestions.reduce((s, x) => s.plus(x.gap), new Decimal(0));

  return (
    <div className="space-y-6">
      <SubNav
        items={[
          { href: "/analyze/allocation", label: "Allocation" },
          { href: "/analyze/risk", label: "Risk" },
          { href: "/analyze/rebalance", label: "Rebalance" },
        ]}
        activeHref="/analyze/rebalance"
        portfolioId={active.id}
      />
      <PortfolioHeader title="Rebalancing workspace" subtitle="Proposal & simulation only — Pulse never places or executes trades" portfolios={portfolios} activeId={active.id} />

      <Card title="Target allocation by asset class">
        <form action="/api/target-allocation" method="post" className="space-y-2">
          <input type="hidden" name="portfolioId" value={active.id} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {ASSET_CLASSES.map((c) => (
              <label key={c} className="flex items-center justify-between gap-2 rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm">
                <span className="capitalize">{c.replace("_", " ")}</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  name={`target_${c}`}
                  defaultValue={targetMap.has(c) ? Math.round((targetMap.get(c) ?? 0) * 100) : ""}
                  className="w-16 rounded border border-pulse-border bg-pulse-surface px-2 py-1 text-right text-sm"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-pulse-muted">Enter target weight as a whole percentage per category. Leave blank to skip.</p>
          <button type="submit" className="rounded-lg bg-pulse-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save targets</button>
        </form>
      </Card>

      <Card title="Drift">
        {drift.length === 0 ? (
          <p className="text-sm text-pulse-muted">Set target weights above to see drift.</p>
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

      <Card title="Contribution-first simulation">
        <form method="get" className="flex items-end gap-2">
          <input type="hidden" name="portfolio" value={active.id} />
          <div>
            <label className="mb-1 block text-xs text-pulse-muted">New contribution amount ({active.baseCurrency})</label>
            <input name="contribution" type="number" min="0" step="1000" defaultValue={searchParams.contribution || ""} className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-lg border border-pulse-border px-3 py-2 text-sm hover:bg-pulse-surfaceAlt">Simulate</button>
        </form>

        {contribution.gt(0) && (
          <div className="mt-4">
            <p className="text-sm text-pulse-muted">
              Directing a new contribution of {formatMoney(contribution, active.baseCurrency)} toward underweight categories first (before considering any
              sales) — a common lower-friction way to move back toward target:
            </p>
            {suggestions.length === 0 ? (
              <p className="mt-2 text-sm text-pulse-muted">No underweight categories to fund right now.</p>
            ) : (
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                    <th className="py-1.5 pr-3">Category</th>
                    <th className="py-1.5 pr-3">Suggested allocation</th>
                    <th className="py-1.5 pr-3">Share of contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s) => {
                    const share = totalGap.gt(0) ? Decimal.min(contribution.times(s.gap.dividedBy(totalGap)), s.gap) : new Decimal(0);
                    return (
                      <tr key={s.category} className="border-b border-pulse-border/50">
                        <td className="py-1.5 pr-3 capitalize">{s.category.replace("_", " ")}</td>
                        <td className="py-1.5 pr-3">{formatMoney(share, active.baseCurrency)}</td>
                        <td className="py-1.5 pr-3">{formatPct(contribution.gt(0) ? share.dividedBy(contribution).times(100).toNumber() : 0, 1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        <a
          href={`/api/reports/rebalance-checklist?portfolio=${active.id}${contribution.gt(0) ? `&contribution=${contribution.toString()}` : ""}`}
          className="mt-4 inline-block rounded-lg border border-pulse-border px-3 py-2 text-xs hover:bg-pulse-surfaceAlt"
        >
          Export checklist (CSV)
        </a>
      </Card>

      <Disclaimer text="This is a simulation to inform your own decisions, not an order, a recommendation, or automated execution. Pulse never places trades on your behalf." />
    </div>
  );
}
