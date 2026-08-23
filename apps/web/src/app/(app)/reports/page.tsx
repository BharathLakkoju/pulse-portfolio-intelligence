import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { db } from "@/lib/db";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";

const REPORT_KINDS = [
  { kind: "weekly_digest", label: "Weekly digest (email replacement)", formats: ["pdf"] },
  { kind: "portfolio_summary", label: "Portfolio summary", formats: ["pdf", "csv"] },
  { kind: "performance", label: "Performance report", formats: ["pdf"] },
  { kind: "risk", label: "Risk report", formats: ["pdf"] },
  { kind: "income", label: "Income report", formats: ["csv"] },
  { kind: "goal_progress", label: "Goal progress report", formats: ["pdf"] },
];

export default async function ReportsPage({ searchParams }: { searchParams: { portfolio?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const history = await db.savedReport.findMany({ where: { userId: user.id, portfolioId: active.id }, orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <div className="space-y-6">
      <PortfolioHeader title="Reports" subtitle="Generate on demand — scheduling is a Pro/Premium feature" portfolios={portfolios} activeId={active.id} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORT_KINDS.map((r) => (
          <Card key={r.kind} title={r.label}>
            <div className="flex flex-wrap gap-2">
              {r.formats.map((f) => (
                <a key={f} href={`/api/reports/generate?portfolio=${active.id}&kind=${r.kind}&format=${f}`} className="rounded-lg border border-pulse-border px-3 py-1.5 text-xs uppercase hover:bg-pulse-surfaceAlt">
                  {f}
                </a>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card title="Also available">
        <ul className="space-y-1 text-sm text-pulse-muted">
          <li>Tax report (transaction ledger, lots, gain summary, assumptions) — see the <a href={`/tax?portfolio=${active.id}`} className="text-pulse-accent hover:underline">Tax workspace</a>.</li>
          <li>Rebalance checklist — see <a href={`/analyze/rebalance?portfolio=${active.id}`} className="text-pulse-accent hover:underline">Analyze → Rebalance</a>.</li>
        </ul>
      </Card>

      <Card title="Recently generated">
        {history.length === 0 ? (
          <EmptyState title="No reports generated yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                <th className="py-1.5 pr-3">Kind</th>
                <th className="py-1.5 pr-3">Format</th>
                <th className="py-1.5 pr-3">Generated</th>
                <th className="py-1.5 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-pulse-border/50">
                  <td className="py-1.5 pr-3 capitalize">{h.kind.replace("_", " ")}</td>
                  <td className="py-1.5 pr-3 uppercase">{h.format}</td>
                  <td className="py-1.5 pr-3">{formatDate(h.createdAt)}</td>
                  <td className="py-1.5 pr-3"><a href={`/api/reports/download/${h.id}`} className="text-pulse-accent hover:underline">Download</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
