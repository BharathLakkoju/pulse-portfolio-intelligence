import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { computePositions, aggregateByInstrument, aggregateTotals, groupBy } from "@/lib/portfolio";
import { computeXirr } from "@/lib/performance";
import { computeConcentration, computeDriftReport } from "@/lib/risk";
import { getSnapshotSeries } from "@/lib/snapshots";
import { db } from "@/lib/db";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { Card, StatTile, Badge, EmptyState } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/GainLoss";
import { ExplainBlock } from "@/components/ui/Explain";
import { Disclaimer, DemoBanner } from "@/components/ui/Disclaimer";
import { formatMoney, formatPct, formatDate } from "@/lib/format";
import { addDays, periodStartDate } from "@/lib/dates";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { ValueHistoryChart } from "@/components/charts/ValueHistoryChart";

export default async function OverviewPage({ searchParams }: { searchParams: { portfolio?: string; period?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) {
    return (
      <EmptyState
        title="No portfolios yet"
        body="Create your first portfolio by importing a CSV, connecting a demo source, or adding a manual holding."
        action={
          <Link href="/connections" className="rounded-lg bg-pulse-accent px-4 py-2 text-sm font-medium text-white">
            Add your first source
          </Link>
        }
      />
    );
  }

  const period = searchParams.period || "1Y";
  const positions = await computePositions(active.id);
  const held = aggregateByInstrument(positions).sort((a, b) => b.currentValue.comparedTo(a.currentValue));
  const totals = aggregateTotals(positions);
  const xirr = await computeXirr(active.id, active.baseCurrency);
  const concentration = await computeConcentration(active.id);
  const drift = await computeDriftReport(active.id);
  const driftBreaches = drift.filter((d) => d.breachesThreshold);

  const now = new Date();
  const periodStart = periodStartDate(period, now) ?? new Date("2000-01-01");
  const series = await getSnapshotSeries(active.id, periodStart, now);
  const chartSeries = series.map((s) => ({ date: s.date.toISOString().slice(0, 10), value: s.totalValue.toNumber() }));
  const periodBegin = series[0]?.totalValue;
  const periodChange = periodBegin ? totals.currentValue.minus(periodBegin) : null;
  const periodChangePct = periodBegin && periodBegin.gt(0) ? periodChange!.dividedBy(periodBegin).times(100).toNumber() : null;

  const byAssetClass = groupBy(held, (p) => p.assetClass);
  const allocationData = Object.entries(byAssetClass).map(([assetClass, rows]) => ({
    name: assetClass.replace("_", " "),
    value: rows.reduce((s, r) => s + r.currentValue.toNumber(), 0),
  }));

  const movers = [...held].sort((a, b) => (b.returnPct ?? 0) - (a.returnPct ?? 0));
  const gainers = movers.filter((m) => (m.returnPct ?? 0) > 0).slice(0, 3);
  const losers = movers.filter((m) => (m.returnPct ?? 0) < 0).slice(-3).reverse();

  const staleCount = held.filter((p) => p.priceLabel === "stale" || p.priceLabel === "unavailable").length;
  const missingCostCount = held.filter((p) => p.avgCostPerUnit.lte(0) && p.quantity.gt(0)).length;
  const completeness = held.length > 0 ? Math.round(((held.length - staleCount - missingCostCount) / held.length) * 100) : 100;

  const alerts = await db.alert.findMany({
    where: { userId: user.id, OR: [{ portfolioId: active.id }, { portfolioId: null }], readAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const goals = await db.goal.findMany({ where: { portfolioId: active.id } });
  const upcoming: Array<{ label: string; date: Date }> = [];
  for (const g of goals) {
    if (g.contributionFrequency === "monthly") {
      const nextDay = new Date(now.getFullYear(), now.getMonth(), Math.min(g.createdAt.getUTCDate(), 28));
      const next = nextDay < now ? addDays(nextDay, 30) : nextDay;
      upcoming.push({ label: `SIP contribution — ${g.name}`, date: next });
    }
  }
  const fdLots = await db.taxLot.findMany({ where: { portfolioId: active.id, instrument: { assetClass: "fixed_deposit" }, closedAt: null } });
  for (const lot of fdLots) {
    upcoming.push({ label: "Fixed deposit maturity (est. 36mo tenor)", date: addDays(lot.acquiredAt, 365 * 3) });
  }
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      <PortfolioHeader title="Overview" subtitle={`${active.name} · Base currency ${active.baseCurrency}`} portfolios={portfolios} activeId={active.id} />

      {active.isDemo && <DemoBanner text="This portfolio is pre-seeded demo data (synthetic prices, simulated broker/crypto connections). See QUESTIONS.md for what's real vs. simulated." />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Current value" value={formatMoney(totals.currentValue, active.baseCurrency)} sub={`Invested ${formatMoney(totals.investedValue, active.baseCurrency)}`} />
        <StatTile
          label={`${period} change`}
          value={periodChange ? <GainLoss value={periodChange} pct={periodChangePct} currency={active.baseCurrency} /> : "—"}
          sub={
            <div className="flex flex-wrap gap-1 pt-1">
              {["1W", "1M", "3M", "6M", "1Y", "3Y", "ALL"].map((p) => (
                <Link
                  key={p}
                  href={`/overview?portfolio=${active.id}&period=${p}`}
                  className={`rounded px-1.5 py-0.5 text-[10px] ${p === period ? "bg-pulse-accent text-white" : "text-pulse-muted hover:bg-pulse-surfaceAlt"}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          }
        />
        <StatTile label="Total P&L" value={<GainLoss value={totals.totalPnl} currency={active.baseCurrency} />} sub="Current + realized + income − contributions − fees − taxes" />
        <StatTile
          label="XIRR"
          value={xirr.value !== null ? formatPct(xirr.value * 100) : <Badge tone="warn">Unavailable</Badge>}
          sub={<ExplainBlock explain={xirr.explain} unavailableReason={xirr.unavailableReason} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title={`Value over time (${period})`} className="lg:col-span-2">
          {chartSeries.length > 1 ? <ValueHistoryChart data={chartSeries} currency={active.baseCurrency} /> : <p className="text-sm text-pulse-muted">Not enough history yet for this range.</p>}
        </Card>
        <Card title="Allocation by asset class">
          {allocationData.length > 0 ? <AllocationChart data={allocationData} /> : <p className="text-sm text-pulse-muted">No holdings yet.</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Concentration">
          <p className="text-lg font-semibold capitalize">{concentration.label.replace("_", " ")}</p>
          <p className="text-xs text-pulse-muted">HHI {concentration.hhiScaled.toFixed(0)} · Top holding {formatPct(concentration.topHoldingWeight * 100)}</p>
        </Card>
        <Card title="Diversification">
          <p className="text-lg font-semibold">{concentration.effectiveHoldings.toFixed(1)} effective holdings</p>
          <p className="text-xs text-pulse-muted">{concentration.holdingCount} positions held</p>
        </Card>
        <Card title="Allocation drift">
          {driftBreaches.length > 0 ? (
            <>
              <p className="text-lg font-semibold text-pulse-warn">{driftBreaches.length} category breaching threshold</p>
              <p className="text-xs text-pulse-muted">{driftBreaches.map((d) => d.category).join(", ")}</p>
            </>
          ) : (
            <p className="text-sm text-pulse-muted">{drift.length > 0 ? "Within target thresholds." : "No target allocation set yet."}</p>
          )}
        </Card>
        <Card title="Data completeness">
          <p className="text-lg font-semibold">{completeness}%</p>
          <p className="text-xs text-pulse-muted">{staleCount} stale price(s) · {missingCostCount} missing cost basis</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Top gainers / losers">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-xs uppercase text-pulse-muted">Gainers</p>
              {gainers.length === 0 && <p className="text-xs text-pulse-muted">None</p>}
              {gainers.map((g) => (
                <div key={g.instrumentId} className="flex items-center justify-between py-1 text-sm">
                  <span>{g.symbol}</span>
                  <GainLoss value={g.unrealizedPnl} pct={g.returnPct} currency={active.baseCurrency} showMoney={false} size="sm" />
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-xs uppercase text-pulse-muted">Losers</p>
              {losers.length === 0 && <p className="text-xs text-pulse-muted">None</p>}
              {losers.map((g) => (
                <div key={g.instrumentId} className="flex items-center justify-between py-1 text-sm">
                  <span>{g.symbol}</span>
                  <GainLoss value={g.unrealizedPnl} pct={g.returnPct} currency={active.baseCurrency} showMoney={false} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Insight feed" action={<Link href="/ai" className="text-xs text-pulse-accent hover:underline">Ask Pulse →</Link>}>
          {alerts.length === 0 && <p className="text-sm text-pulse-muted">No open insights right now.</p>}
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.title}</span>
                  <Badge tone={a.severity === "critical" ? "bad" : a.severity === "warning" ? "warn" : "neutral"}>{a.severity}</Badge>
                </div>
                <p className="mt-1 text-xs text-pulse-muted">{a.message}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Upcoming: dividends, SIPs, maturities">
        {upcoming.length === 0 ? (
          <p className="text-sm text-pulse-muted">Nothing scheduled.</p>
        ) : (
          <ul className="divide-y divide-pulse-border text-sm">
            {upcoming.slice(0, 6).map((u, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <span>{u.label}</span>
                <span className="text-pulse-muted">{formatDate(u.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Disclaimer />
    </div>
  );
}
