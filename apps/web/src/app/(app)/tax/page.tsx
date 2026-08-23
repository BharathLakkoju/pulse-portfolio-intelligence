import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { computeFifoLots, summarizeGainsByFY } from "@/lib/tax";
import { getEntitlements } from "@/lib/entitlements";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/format";

export default async function TaxPage({ searchParams }: { searchParams: { portfolio?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const { plan } = await getEntitlements(user.id);
  const { openLots, closedLots, config } = await computeFifoLots(active.id, user.taxResidency);
  const gainsByFY = summarizeGainsByFY(closedLots);

  return (
    <div className="space-y-6">
      <PortfolioHeader title="Tax workspace" subtitle={`${user.taxResidency} v1 — estimate only`} portfolios={portfolios} activeId={active.id} />

      <div className="rounded-lg border border-pulse-warn/40 bg-pulse-warn/10 px-4 py-3 text-sm text-pulse-warn">
        <span className="font-semibold">CA review pending. </span>
        {config.disclaimer}
      </div>

      {plan.taxWorkspace === "none" ? (
        <Card>
          <p className="text-sm text-pulse-muted">The tax workspace (capital-gains estimate, tax-lot ledger, CA-ready exports) is available on Pro and Premium plans.</p>
        </Card>
      ) : (
        <>
          <Card title="Cost-basis method & holding-period rules (configurable, not hardcoded)">
            <p className="text-sm text-pulse-text">Method: <span className="font-medium">{config.costBasisMethod}</span></p>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                  <th className="py-1.5 pr-3">Asset class</th>
                  <th className="py-1.5 pr-3">Long-term threshold</th>
                </tr>
              </thead>
              <tbody>
                {config.holdingPeriodRules.map((r) => (
                  <tr key={r.assetClass} className="border-b border-pulse-border/50">
                    <td className="py-1.5 pr-3 capitalize">{r.assetClass.replace("_", " ")}</td>
                    <td className="py-1.5 pr-3">{r.longTermThresholdDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Realized capital gains by financial year">
            {gainsByFY.length === 0 ? (
              <EmptyState title="No realized gains yet" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                    <th className="py-1.5 pr-3">Financial year</th>
                    <th className="py-1.5 pr-3">Short-term</th>
                    <th className="py-1.5 pr-3">Long-term</th>
                  </tr>
                </thead>
                <tbody>
                  {gainsByFY.map((s) => (
                    <tr key={s.financialYear} className="border-b border-pulse-border/50">
                      <td className="py-1.5 pr-3">{s.financialYear}</td>
                      <td className="py-1.5 pr-3">{formatMoney(s.shortTermGain, active.baseCurrency)}</td>
                      <td className="py-1.5 pr-3">{formatMoney(s.longTermGain, active.baseCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Closed tax lots (realized)">
            {closedLots.length === 0 ? (
              <EmptyState title="No closed lots yet" />
            ) : (
              <div className="max-h-[400px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-pulse-surface">
                    <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                      <th className="py-1.5 pr-3">Instrument</th>
                      <th className="py-1.5 pr-3">Acquired</th>
                      <th className="py-1.5 pr-3">Closed</th>
                      <th className="py-1.5 pr-3">Qty</th>
                      <th className="py-1.5 pr-3">Gain</th>
                      <th className="py-1.5 pr-3">Holding period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedLots.map((l, i) => (
                      <tr key={i} className="border-b border-pulse-border/50">
                        <td className="py-1.5 pr-3">{l.symbol}</td>
                        <td className="py-1.5 pr-3">{formatDate(l.acquiredAt)}</td>
                        <td className="py-1.5 pr-3">{formatDate(l.closedAt)}</td>
                        <td className="py-1.5 pr-3">{l.quantity.toFixed(4)}</td>
                        <td className="py-1.5 pr-3">{formatMoney(l.realizedGain, l.currency)}</td>
                        <td className="py-1.5 pr-3"><Badge tone="neutral">{l.holdingPeriod.replace("_", " ")}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Open lots (unrealized)">
            <p className="text-sm text-pulse-muted">{openLots.length} open lot(s) across held instruments.</p>
          </Card>

          <Card title="Export">
            <div className="flex flex-wrap gap-2">
              <a href={`/api/reports/tax?portfolio=${active.id}&format=csv`} className="rounded-lg border border-pulse-border px-3 py-2 text-sm hover:bg-pulse-surfaceAlt">Transaction ledger (CSV)</a>
              <a href={`/api/reports/tax?portfolio=${active.id}&format=xlsx`} className="rounded-lg border border-pulse-border px-3 py-2 text-sm hover:bg-pulse-surfaceAlt">CA-ready workbook (XLSX)</a>
              <a href={`/api/reports/tax?portfolio=${active.id}&format=pdf`} className="rounded-lg border border-pulse-border px-3 py-2 text-sm hover:bg-pulse-surfaceAlt">Summary (PDF)</a>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
