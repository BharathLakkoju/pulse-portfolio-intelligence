import { redirect } from "next/navigation";
import Decimal from "decimal.js";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { db } from "@/lib/db";
import { addDays, indiaFinancialYear } from "@/lib/dates";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { SubNav } from "@/components/shell/SubNav";
import { Card, EmptyState } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/format";

export default async function IncomeCalendarPage({ searchParams }: { searchParams: { portfolio?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const income = await db.transaction.findMany({
    where: { portfolioId: active.id, eventType: { in: ["dividend", "interest", "staking_reward"] } },
    include: { instrument: true },
    orderBy: { occurredAt: "desc" },
  });

  const byFY = new Map<string, Decimal>();
  for (const t of income) {
    const fy = indiaFinancialYear(t.occurredAt);
    byFY.set(fy, (byFY.get(fy) ?? new Decimal(0)).plus(new Decimal(t.grossAmount)));
  }

  const goals = await db.goal.findMany({ where: { portfolioId: active.id } });
  const now = new Date();
  const upcomingSips = goals
    .filter((g) => g.contributionFrequency === "monthly")
    .map((g) => {
      const nextDay = new Date(now.getFullYear(), now.getMonth(), Math.min(g.createdAt.getUTCDate(), 28));
      const next = nextDay < now ? addDays(nextDay, 30) : nextDay;
      return { label: `${g.name} SIP`, amount: g.contributionAmount, date: next };
    });

  const fdLots = await db.taxLot.findMany({ where: { portfolioId: active.id, instrument: { assetClass: "fixed_deposit" }, closedAt: null }, include: { instrument: true } });
  const maturities = fdLots.map((l) => ({ label: `${l.instrument.name} maturity`, date: addDays(l.acquiredAt, 365 * 3) }));

  return (
    <div className="space-y-6">
      <SubNav items={[{ href: "/plan/goals", label: "Goals" }, { href: "/plan/income-calendar", label: "Income calendar" }]} activeHref="/plan/income-calendar" portfolioId={active.id} />
      <PortfolioHeader title="Income & event calendar" subtitle="Dividends, interest, SIPs, and maturities" portfolios={portfolios} activeId={active.id} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Upcoming SIPs">
          {upcomingSips.length === 0 ? (
            <EmptyState title="No recurring SIPs configured" />
          ) : (
            <ul className="divide-y divide-pulse-border text-sm">
              {upcomingSips.map((s, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <span>{s.label}</span>
                  <span className="text-pulse-muted">{formatMoney(s.amount, active.baseCurrency)} · {formatDate(s.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Upcoming maturities">
          {maturities.length === 0 ? (
            <EmptyState title="No fixed deposits on file" />
          ) : (
            <ul className="divide-y divide-pulse-border text-sm">
              {maturities.map((m, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <span>{m.label}</span>
                  <span className="text-pulse-muted">{formatDate(m.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Income by financial year">
        {byFY.size === 0 ? (
          <EmptyState title="No dividend or interest income recorded yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                <th className="py-1.5 pr-3">Financial year</th>
                <th className="py-1.5 pr-3">Total income</th>
              </tr>
            </thead>
            <tbody>
              {[...byFY.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([fy, total]) => (
                <tr key={fy} className="border-b border-pulse-border/50">
                  <td className="py-1.5 pr-3">{fy}</td>
                  <td className="py-1.5 pr-3">{formatMoney(total, active.baseCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Income transactions">
        <div className="max-h-[400px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-pulse-surface">
              <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                <th className="py-1.5 pr-3">Date</th>
                <th className="py-1.5 pr-3">Type</th>
                <th className="py-1.5 pr-3">Instrument</th>
                <th className="py-1.5 pr-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {income.map((t) => (
                <tr key={t.id} className="border-b border-pulse-border/50">
                  <td className="py-1.5 pr-3">{formatDate(t.occurredAt)}</td>
                  <td className="py-1.5 pr-3">{t.eventType}</td>
                  <td className="py-1.5 pr-3">{t.instrument?.symbol ?? "—"}</td>
                  <td className="py-1.5 pr-3">{formatMoney(t.grossAmount, t.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
