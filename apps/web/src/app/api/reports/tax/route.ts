import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { computeFifoLots, summarizeGainsByFY } from "@/lib/tax";
import { toCsv } from "@/lib/csv";
import { renderXlsxWorkbook, renderPdfReport } from "@/lib/reports";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const portfolioId = url.searchParams.get("portfolio") || "";
  const format = url.searchParams.get("format") || "csv";

  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  if (!portfolio) return new Response("Not found", { status: 404 });

  const { closedLots, config } = await computeFifoLots(portfolioId, user.taxResidency);
  const gainsByFY = summarizeGainsByFY(closedLots);
  const transactions = await db.transaction.findMany({ where: { portfolioId }, include: { instrument: true }, orderBy: { occurredAt: "asc" } });

  await writeAuditLog(user.id, "export", { event: "tax_export", portfolioId, format });

  if (format === "csv") {
    const csv = toCsv(
      ["transaction_id", "date", "event_type", "symbol", "quantity", "gross_amount", "fee_amount", "tax_amount", "currency", "reconciliation_state"],
      transactions.map((t) => [t.id, t.occurredAt.toISOString().slice(0, 10), t.eventType, t.instrument?.symbol ?? "", t.quantity, t.grossAmount, t.feeAmount, t.taxAmount, t.currency, t.reconciliationState]),
    );
    return new Response(csv + `\n\n# ${config.disclaimer}`, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="tax-ledger.csv"' } });
  }

  if (format === "xlsx") {
    const buffer = await renderXlsxWorkbook([
      { name: "Transactions", headers: ["Date", "Type", "Symbol", "Quantity", "Gross", "Fee", "Tax", "Currency"], rows: transactions.map((t) => [t.occurredAt.toISOString().slice(0, 10), t.eventType, t.instrument?.symbol ?? "", t.quantity, t.grossAmount, t.feeAmount, t.taxAmount, t.currency]) },
      { name: "Realized Gains", headers: ["Symbol", "Acquired", "Closed", "Qty", "Cost basis", "Proceeds", "Gain", "Holding period"], rows: closedLots.map((l) => [l.symbol, l.acquiredAt.toISOString().slice(0, 10), l.closedAt.toISOString().slice(0, 10), l.quantity.toFixed(4), l.costBasisPerUnit.toFixed(2), l.proceedsPerUnit.toFixed(2), l.realizedGain.toFixed(2), l.holdingPeriod]) },
      { name: "Gains by FY", headers: ["Financial Year", "Short-term", "Long-term"], rows: gainsByFY.map((s) => [s.financialYear, s.shortTermGain.toFixed(2), s.longTermGain.toFixed(2)]) },
      { name: "Assumptions", headers: ["Field", "Value"], rows: [["Cost basis method", config.costBasisMethod], ["Tax logic reviewed by CA", String(config.taxLogicReviewed)], ["Disclaimer", config.disclaimer]] },
    ]);
    return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="tax-workbook.xlsx"' } });
  }

  const pdf = await renderPdfReport("Pulse — Capital Gains Estimate", `${portfolio.name} · Estimate only, CA review pending`, [
    { heading: "Assumptions", lines: [`Cost basis method: ${config.costBasisMethod}`, config.disclaimer] },
    { heading: "Gains by financial year", lines: gainsByFY.map((s) => `${s.financialYear}: short-term ${s.shortTermGain.toFixed(2)}, long-term ${s.longTermGain.toFixed(2)}`) },
  ]);
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="tax-summary.pdf"' } });
}
