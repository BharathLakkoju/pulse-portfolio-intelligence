import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { computeGoalProgress } from "@/lib/goals";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { SubNav } from "@/components/shell/SubNav";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { formatMoney, formatDate } from "@/lib/format";

const STATUS_TONE = { ahead: "good", on_track: "accent", behind: "warn" } as const;
const STATUS_LABEL = { ahead: "Ahead of scenario", on_track: "On track", behind: "Behind scenario" } as const;

export default async function GoalsPage({ searchParams }: { searchParams: { portfolio?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const goals = await computeGoalProgress(active.id);

  return (
    <div className="space-y-6">
      <SubNav items={[{ href: "/plan/goals", label: "Goals" }, { href: "/plan/income-calendar", label: "Income calendar" }]} activeHref="/plan/goals" portfolioId={active.id} />
      <PortfolioHeader title="Goals" subtitle="Illustrative scenarios based on your assumptions — not promises" portfolios={portfolios} activeId={active.id} />

      <Card title="Add a goal">
        <form action="/api/goals" method="post" className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input type="hidden" name="portfolioId" value={active.id} />
          <input name="name" placeholder="Goal name" required className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm" />
          <select name="type" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm">
            {["emergency_fund", "home", "education", "retirement", "travel", "custom"].map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
          <input name="targetDate" type="date" required className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm" />
          <input name="targetAmount" placeholder={`Target amount (${active.baseCurrency})`} required className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm" />
          <input name="contributionAmount" placeholder="Contribution amount" defaultValue="0" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm" />
          <select name="contributionFrequency" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="one_time">One-time</option>
          </select>
          <div className="md:col-span-3">
            <button type="submit" className="rounded-lg bg-pulse-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">Create goal</button>
          </div>
        </form>
      </Card>

      {goals.length === 0 ? (
        <EmptyState title="No goals yet" body="Add a goal above to see a projected scenario against your contribution plan." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <Card key={g.goalId} title={g.name} action={<Badge tone={STATUS_TONE[g.status]}>{STATUS_LABEL[g.status]}</Badge>}>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-pulse-muted">Target</span><span>{formatMoney(g.targetAmount, active.baseCurrency)} by {formatDate(g.targetDate)}</span></div>
                <div className="flex justify-between"><span className="text-pulse-muted">Current linked value</span><span>{formatMoney(g.currentValue, active.baseCurrency)}</span></div>
                <div className="flex justify-between"><span className="text-pulse-muted">Projected range</span><span>{formatMoney(g.projectedLow, active.baseCurrency)} – {formatMoney(g.projectedHigh, active.baseCurrency)}</span></div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-pulse-surfaceAlt">
                <div className="h-full bg-pulse-accent" style={{ width: `${Math.min(100, Math.max(4, g.progressPct))}%` }} />
              </div>
              <p className="mt-1 text-xs text-pulse-muted">{g.progressPct.toFixed(0)}% of target on this scenario · {g.yearsRemaining.toFixed(1)}y remaining</p>
            </Card>
          ))}
        </div>
      )}

      <Disclaimer text="Goal projections assume the expected-return range you entered and are for planning purposes only. They are scenarios, not guarantees of future performance." />
    </div>
  );
}
