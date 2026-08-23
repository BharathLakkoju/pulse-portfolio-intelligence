import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { computePositions, aggregateByInstrument, aggregateTotals } from "@/lib/portfolio";
import { computeXirr } from "@/lib/performance";
import { computeConcentration } from "@/lib/risk";
import { computeGoalProgress } from "@/lib/goals";
import { toCsv } from "@/lib/csv";
import { renderPdfReport, renderXlsxWorkbook } from "@/lib/reports";
import { saveObject } from "@/lib/storage";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const portfolioId = url.searchParams.get("portfolio") || "";
  const kind = url.searchParams.get("kind") || "portfolio_summary";
  const format = url.searchParams.get("format") || "pdf";

  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  if (!portfolio) return new Response("Not found", { status: 404 });

  const positions = await computePositions(portfolioId);
  const held = aggregateByInstrument(positions);
  const totals = aggregateTotals(positions);

  let buffer: Buffer;
  let contentType: string;
  let filename: string;

  if (kind === "portfolio_summary") {
    if (format === "csv") {
      const csv = toCsv(["symbol", "quantity", "avg_cost", "current_price", "current_value", "unrealized_pnl"], held.map((h) => [h.symbol, h.quantity.toFixed(4), h.avgCostPerUnit.toFixed(2), h.currentPrice?.toFixed(2) ?? "", h.currentValue.toFixed(2), h.unrealizedPnl.toFixed(2)]));
      buffer = Buffer.from(csv);
      contentType = "text/csv";
      filename = "portfolio-summary.csv";
    } else {
      buffer = await renderPdfReport("Portfolio Summary", `${portfolio.name} · ${new Date().toLocaleDateString()}`, [
        { heading: "Totals", lines: [`Current value: ${totals.currentValue.toFixed(2)} ${portfolio.baseCurrency}`, `Invested: ${totals.investedValue.toFixed(2)}`, `Total P&L: ${totals.totalPnl.toFixed(2)}`] },
        { heading: "Top holdings", lines: held.slice(0, 10).map((h) => `${h.symbol}: ${h.currentValue.toFixed(2)} (${h.returnPct?.toFixed(1) ?? "n/a"}%)`) },
      ]);
      contentType = "application/pdf";
      filename = "portfolio-summary.pdf";
    }
  } else if (kind === "performance") {
    const xirr = await computeXirr(portfolioId, portfolio.baseCurrency);
    buffer = await renderPdfReport("Performance Report", `${portfolio.name}`, [
      { heading: "Returns", lines: [`XIRR: ${xirr.value !== null ? (xirr.value * 100).toFixed(2) + "%" : `Unavailable — ${xirr.unavailableReason}`}`, xirr.explain.formula] },
      { heading: "Contribution to return (top movers)", lines: held.slice(0, 10).map((h) => `${h.symbol}: ${h.unrealizedPnl.toFixed(2)}`) },
    ]);
    contentType = "application/pdf";
    filename = "performance-report.pdf";
  } else if (kind === "risk") {
    const concentration = await computeConcentration(portfolioId);
    buffer = await renderPdfReport("Risk Report", `${portfolio.name}`, [
      { heading: "Concentration", lines: [`HHI: ${concentration.hhiScaled.toFixed(0)} (${concentration.label})`, `Top holding weight: ${(concentration.topHoldingWeight * 100).toFixed(1)}%`] },
      { heading: "Top holdings", lines: concentration.topHoldings.map((h) => `${h.symbol}: ${(h.weight * 100).toFixed(1)}%`) },
    ]);
    contentType = "application/pdf";
    filename = "risk-report.pdf";
  } else if (kind === "income") {
    const income = await db.transaction.findMany({ where: { portfolioId, eventType: { in: ["dividend", "interest", "staking_reward"] } }, include: { instrument: true } });
    const csv = toCsv(["date", "type", "symbol", "amount", "currency"], income.map((t) => [t.occurredAt.toISOString().slice(0, 10), t.eventType, t.instrument?.symbol ?? "", t.grossAmount, t.currency]));
    buffer = Buffer.from(csv);
    contentType = "text/csv";
    filename = "income-report.csv";
  } else if (kind === "weekly_digest") {
    const xirr = await computeXirr(portfolioId, portfolio.baseCurrency);
    const concentration = await computeConcentration(portfolioId);
    const recentAlerts = await db.alert.findMany({ where: { userId: user.id, portfolioId }, orderBy: { createdAt: "desc" }, take: 5 });
    const movers = [...held].sort((a, b) => (b.returnPct ?? 0) - (a.returnPct ?? 0));
    buffer = await renderPdfReport("Weekly Portfolio Digest", `${portfolio.name} · Week of ${new Date().toLocaleDateString()}`, [
      { heading: "Snapshot", lines: [`Current value: ${totals.currentValue.toFixed(2)} ${portfolio.baseCurrency}`, `Total P&L: ${totals.totalPnl.toFixed(2)}`, `XIRR: ${xirr.value !== null ? (xirr.value * 100).toFixed(2) + "%" : "unavailable"}`] },
      { heading: "Top movers", lines: movers.slice(0, 3).map((h) => `${h.symbol}: ${h.unrealizedPnl.toFixed(2)} (${h.returnPct?.toFixed(1) ?? "n/a"}%)`) },
      { heading: "Concentration", lines: [`${concentration.label.replace("_", " ")} — top holding ${(concentration.topHoldingWeight * 100).toFixed(1)}%`] },
      { heading: "Open insights", lines: recentAlerts.length > 0 ? recentAlerts.map((a) => `${a.title} — ${a.message}`) : ["No open insights this week."] },
    ]);
    contentType = "application/pdf";
    filename = "weekly-digest.pdf";
  } else {
    const goals = await computeGoalProgress(portfolioId);
    buffer = await renderPdfReport("Goal Progress Report", `${portfolio.name}`, [
      { heading: "Goals", lines: goals.map((g) => `${g.name}: ${g.progressPct.toFixed(0)}% of target (${g.status.replace("_", " ")}), ${g.yearsRemaining.toFixed(1)}y remaining`) },
    ]);
    contentType = "application/pdf";
    filename = "goal-progress-report.pdf";
  }

  const storageRef = await saveObject(`reports/${user.id}`, filename, buffer);
  await db.savedReport.create({ data: { userId: user.id, portfolioId, kind, format, storageRef } });
  await writeAuditLog(user.id, "export", { event: "report_generated", portfolioId, kind, format });

  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${filename}"` } });
}
