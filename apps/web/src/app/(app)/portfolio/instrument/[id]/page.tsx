import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { db } from "@/lib/db";
import { computePositions, aggregateByInstrument } from "@/lib/portfolio";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { Card, Badge, StatTile } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/GainLoss";
import { PriceLabelBadge } from "@/components/ui/Disclaimer";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";
import { ValueHistoryChart } from "@/components/charts/ValueHistoryChart";

export default async function InstrumentDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { portfolio?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const instrument = await db.instrument.findUnique({ where: { id: params.id } });
  if (!instrument) notFound();

  const positions = await computePositions(active.id);
  const held = aggregateByInstrument(positions).find((p) => p.instrumentId === params.id);

  const priceRows = await db.priceHistory.findMany({
    where: { instrumentId: params.id, date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
    orderBy: { date: "asc" },
  });
  const chartData = priceRows.filter((_, i) => i % 3 === 0).map((r) => ({ date: r.date.toISOString().slice(0, 10), value: Number(r.close) }));

  const transactions = await db.transaction.findMany({
    where: { portfolioId: active.id, instrumentId: params.id },
    orderBy: { occurredAt: "desc" },
  });
  const dividends = transactions.filter((t) => t.eventType === "dividend" || t.eventType === "interest");
  const corporateActions = transactions.filter((t) => ["split", "merger", "spin_off", "airdrop"].includes(t.eventType));

  const lots = await db.taxLot.findMany({ where: { portfolioId: active.id, instrumentId: params.id }, orderBy: { acquiredAt: "asc" } });

  return (
    <div className="space-y-6">
      <PortfolioHeader title={`${instrument.symbol} · ${instrument.name}`} subtitle={`${instrument.exchange} · ${instrument.assetClass.replace("_", " ")} · ${instrument.currency}`} portfolios={portfolios} activeId={active.id} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Quantity held" value={held ? formatNumber(held.quantity, 4) : "0"} />
        <StatTile label="Avg cost" value={held ? formatMoney(held.avgCostPerUnit, instrument.currency) : "—"} />
        <StatTile label="Current price" value={held?.currentPrice ? <>{formatMoney(held.currentPrice, instrument.currency)} <PriceLabelBadge label={held.priceLabel} /></> : "—"} />
        <StatTile label="Unrealized P&L" value={held ? <GainLoss value={held.unrealizedPnl} pct={held.returnPct} currency={active.baseCurrency} /> : "—"} />
      </div>

      <Card title="Price history (1Y)">
        {chartData.length > 1 ? <ValueHistoryChart data={chartData} currency={instrument.currency} /> : <p className="text-sm text-pulse-muted">Not enough history.</p>}
        {priceRows[0]?.isSynthetic && <p className="mt-2 text-xs text-pulse-warn">Simulated pricing — not live market data. See QUESTIONS.md #4.</p>}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Tax lots (FIFO)">
          {lots.length === 0 ? (
            <p className="text-sm text-pulse-muted">No lots recorded.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                  <th className="py-1.5 pr-3">Acquired</th>
                  <th className="py-1.5 pr-3">Qty remaining</th>
                  <th className="py-1.5 pr-3">Cost/unit</th>
                  <th className="py-1.5 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((l) => (
                  <tr key={l.id} className="border-b border-pulse-border/50">
                    <td className="py-1.5 pr-3">{formatDate(l.acquiredAt)}</td>
                    <td className="py-1.5 pr-3">{l.quantityRemaining}</td>
                    <td className="py-1.5 pr-3">{formatMoney(l.costBasisPerUnit, instrument.currency)}</td>
                    <td className="py-1.5 pr-3">
                      {l.closedAt ? <Badge tone="neutral">{l.holdingPeriod?.replace("_", " ")}</Badge> : <Badge tone="good">open</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Dividend / income history">
          {dividends.length === 0 ? (
            <p className="text-sm text-pulse-muted">None recorded.</p>
          ) : (
            <ul className="divide-y divide-pulse-border text-sm">
              {dividends.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2">
                  <span>{formatDate(d.occurredAt)}</span>
                  <span>{formatMoney(d.grossAmount, d.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {corporateActions.length > 0 && (
        <Card title="Corporate actions">
          <ul className="divide-y divide-pulse-border text-sm">
            {corporateActions.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span className="capitalize">{c.eventType.replace("_", " ")}</span>
                <span>{formatDate(c.occurredAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Transaction history">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
              <th className="py-1.5 pr-3">Date</th>
              <th className="py-1.5 pr-3">Type</th>
              <th className="py-1.5 pr-3">Qty</th>
              <th className="py-1.5 pr-3">Gross</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-pulse-border/50">
                <td className="py-1.5 pr-3">{formatDate(t.occurredAt)}</td>
                <td className="py-1.5 pr-3">{t.eventType}</td>
                <td className="py-1.5 pr-3">{t.quantity}</td>
                <td className="py-1.5 pr-3">{formatMoney(t.grossAmount, t.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
