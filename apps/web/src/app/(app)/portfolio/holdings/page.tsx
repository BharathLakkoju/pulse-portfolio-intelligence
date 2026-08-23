import { redirect } from "next/navigation";
import Link from "next/link";
import Decimal from "decimal.js";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { computePositions, aggregateByInstrument, groupBy } from "@/lib/portfolio";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { SubNav } from "@/components/shell/SubNav";
import { Card, EmptyState, Badge } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/GainLoss";
import { PriceLabelBadge } from "@/components/ui/Disclaimer";
import { formatMoney, formatNumber, formatPct } from "@/lib/format";

export default async function HoldingsPage({ searchParams }: { searchParams: { portfolio?: string; groupBy?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const grouping = searchParams.groupBy || "assetClass";
  const positions = await computePositions(active.id);
  const held = aggregateByInstrument(positions);
  const totalValue = held.reduce((s, p) => s.plus(p.currentValue), new Decimal(0));

  const groupKeyFn = (p: (typeof held)[number]) =>
    grouping === "sector" ? p.sector || "Unclassified" : grouping === "exchange" ? p.exchange : grouping === "currency" ? p.currency : p.assetClass;
  const grouped = groupBy(held, groupKeyFn);

  return (
    <div className="space-y-6">
      <SubNav
        items={[
          { href: "/portfolio/holdings", label: "Holdings" },
          { href: "/portfolio/accounts", label: "Accounts" },
          { href: "/portfolio/transactions", label: "Transactions" },
        ]}
        activeHref="/portfolio/holdings"
        portfolioId={active.id}
      />
      <PortfolioHeader
        title="Holdings"
        subtitle={`${held.length} position(s) across accounts`}
        portfolios={portfolios}
        activeId={active.id}
        action={
          <div className="flex gap-1">
            {["assetClass", "sector", "exchange", "currency"].map((g) => (
              <Link
                key={g}
                href={`/portfolio/holdings?portfolio=${active.id}&groupBy=${g}`}
                className={`rounded px-2 py-1 text-xs ${grouping === g ? "bg-pulse-accent text-white" : "border border-pulse-border text-pulse-muted hover:bg-pulse-surfaceAlt"}`}
              >
                {g === "assetClass" ? "Asset class" : g[0].toUpperCase() + g.slice(1)}
              </Link>
            ))}
          </div>
        }
      />

      {held.length === 0 ? (
        <EmptyState title="No holdings yet" body="Import a CSV, connect a demo source, or add a manual holding to get started." action={<Link href="/connections" className="rounded-lg bg-pulse-accent px-4 py-2 text-sm font-medium text-white">Add a source</Link>} />
      ) : (
        Object.entries(grouped).map(([group, rows]) => {
          const groupValue = rows.reduce((s, r) => s.plus(r.currentValue), new Decimal(0));
          return (
            <Card key={group} title={<span className="capitalize">{group.replace("_", " ")}</span>} action={<span className="text-xs text-pulse-muted">{formatMoney(groupValue, active.baseCurrency)}</span>}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                      <th className="py-2 pr-4">Instrument</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Avg cost</th>
                      <th className="py-2 pr-4">Price</th>
                      <th className="py-2 pr-4">Invested</th>
                      <th className="py-2 pr-4">Current value</th>
                      <th className="py-2 pr-4">Return</th>
                      <th className="py-2 pr-4">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .sort((a, b) => b.currentValue.comparedTo(a.currentValue))
                      .map((p) => (
                        <tr key={p.instrumentId} className="border-b border-pulse-border/50 hover:bg-pulse-surfaceAlt/50">
                          <td className="py-2 pr-4">
                            <Link href={`/portfolio/instrument/${p.instrumentId}?portfolio=${active.id}`} className="font-medium text-pulse-text hover:text-pulse-accent">
                              {p.symbol}
                            </Link>
                            <div className="text-xs text-pulse-muted">{p.name}</div>
                          </td>
                          <td className="py-2 pr-4">{formatNumber(p.quantity, 4)}</td>
                          <td className="py-2 pr-4">{formatMoney(p.avgCostPerUnit, p.currency)}</td>
                          <td className="py-2 pr-4">
                            {p.currentPrice ? formatMoney(p.currentPrice, p.currency) : "—"} <PriceLabelBadge label={p.priceLabel} />
                          </td>
                          <td className="py-2 pr-4">{formatMoney(p.investedValue, active.baseCurrency)}</td>
                          <td className="py-2 pr-4">{formatMoney(p.currentValue, active.baseCurrency)}</td>
                          <td className="py-2 pr-4">
                            <GainLoss value={p.unrealizedPnl} pct={p.returnPct} currency={active.baseCurrency} size="sm" />
                          </td>
                          <td className="py-2 pr-4 text-pulse-muted">{formatPct(totalValue.gt(0) ? p.currentValue.dividedBy(totalValue).times(100).toNumber() : 0, 1)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
