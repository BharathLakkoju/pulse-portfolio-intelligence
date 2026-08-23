import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { computeConcentration } from "@/lib/risk";
import { computeRiskDashboard } from "@/lib/risk";
import { getEntitlements } from "@/lib/entitlements";
import { periodStartDate } from "@/lib/dates";
import { REGION_BENCHMARK_CONFIG } from "@pulse/shared-types";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { SubNav } from "@/components/shell/SubNav";
import { Card, StatTile, Badge } from "@/components/ui/Card";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { formatPct } from "@/lib/format";

export default async function RiskPage({ searchParams }: { searchParams: { portfolio?: string; benchmark?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const { plan } = await getEntitlements(user.id);
  const concentration = await computeConcentration(active.id);

  const benchmarkConfig = REGION_BENCHMARK_CONFIG[user.country] ?? REGION_BENCHMARK_CONFIG.IN;
  const benchmarkId = searchParams.benchmark || benchmarkConfig.defaultBenchmarkId;
  const start = periodStartDate("1Y", new Date()) ?? new Date("2023-01-01");
  const risk = plan.advancedRisk ? await computeRiskDashboard(active.id, start, new Date(), benchmarkId) : null;

  return (
    <div className="space-y-6">
      <SubNav
        items={[
          { href: "/analyze/allocation", label: "Allocation" },
          { href: "/analyze/risk", label: "Risk" },
          { href: "/analyze/rebalance", label: "Rebalance" },
        ]}
        activeHref="/analyze/risk"
        portfolioId={active.id}
      />
      <PortfolioHeader title="Risk & diversification" subtitle="Historical, backward-looking measures — not a prediction of future risk" portfolios={portfolios} activeId={active.id} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Concentration (HHI)" value={concentration.hhiScaled.toFixed(0)} sub={<span className="capitalize">{concentration.label.replace("_", " ")}</span>} />
        <StatTile label="Top holding weight" value={formatPct(concentration.topHoldingWeight * 100, 1)} />
        <StatTile label="Top 5 weight" value={formatPct(concentration.top5Weight * 100, 1)} />
        <StatTile label="Effective holdings" value={concentration.effectiveHoldings.toFixed(1)} sub="1 / HHI" />
      </div>

      <Card title="Top holdings by weight">
        <table className="w-full text-sm">
          <tbody>
            {concentration.topHoldings.map((h) => (
              <tr key={h.symbol} className="border-b border-pulse-border/50">
                <td className="py-1.5 pr-3">{h.symbol}</td>
                <td className="py-1.5 pr-3 text-pulse-muted">{h.name}</td>
                <td className="py-1.5 pr-3 text-right">{formatPct(h.weight * 100, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Advanced risk metrics (1Y)" action={<Badge tone={plan.advancedRisk ? "accent" : "warn"}>{plan.advancedRisk ? plan.name : "Pro feature"}</Badge>}>
        {!plan.advancedRisk ? (
          <p className="text-sm text-pulse-muted">Volatility, Sharpe, Sortino, beta, correlation, and historical VaR are available on Pro and Premium plans. Upgrade in Settings → Billing to preview them.</p>
        ) : risk ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatTile label="Volatility (annualised)" value={risk.volatilityAnnualised !== null ? formatPct(risk.volatilityAnnualised * 100, 1) : "Unavailable"} />
            <StatTile label="Max drawdown" value={risk.maxDrawdownPct !== null ? formatPct(-risk.maxDrawdownPct * 100, 1) : "Unavailable"} />
            <StatTile label="Sharpe ratio" value={risk.sharpe !== null ? risk.sharpe.toFixed(2) : "Unavailable"} sub={`Rf assumption ${(risk.riskFreeRateAssumption * 100).toFixed(1)}%`} />
            <StatTile label="Sortino ratio" value={risk.sortino !== null ? risk.sortino.toFixed(2) : "Unavailable"} />
            <StatTile label={`Beta vs ${risk.benchmarkId}`} value={risk.beta !== null ? risk.beta.toFixed(2) : "Unavailable"} />
            <StatTile label="Correlation to benchmark" value={risk.correlationToBenchmark !== null ? risk.correlationToBenchmark.toFixed(2) : "Unavailable"} />
            <StatTile label="Historical VaR (95%)" value={risk.historicalVaR95 !== null ? formatPct(-risk.historicalVaR95 * 100, 2) : "Unavailable"} sub="1-day, historical distribution" />
            <StatTile label="Observations" value={risk.observations} sub={`Annualisation: ${risk.annualisationMethod}`} />
          </div>
        ) : null}
        {risk && risk.dataQualityWarnings.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-pulse-warn">
            {risk.dataQualityWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </Card>

      <Disclaimer text="Risk metrics are calculated from historical data only and do not predict future returns. Benchmark and risk-free-rate choices are assumptions, shown above, not recommendations." />
    </div>
  );
}
