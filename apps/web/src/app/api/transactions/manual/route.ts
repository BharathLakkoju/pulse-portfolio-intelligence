import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { ingestTransactions, type IngestableTransaction } from "@/lib/ingest";
import { recomputeSnapshots } from "@/lib/snapshots";
import { persistTaxLots } from "@/lib/tax";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();
  const portfolioId = String(form.get("portfolioId") || "");

  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

  const account = await db.account.findFirst({ where: { id: String(form.get("accountId") || ""), portfolioId } });
  if (!account) return NextResponse.redirect(new URL(`/portfolio/transactions?portfolio=${portfolioId}`, req.url), 303);

  const row: IngestableTransaction = {
    sourceId: "manual",
    occurredAt: new Date(String(form.get("occurredAt") || new Date().toISOString())),
    eventType: String(form.get("eventType") || "buy"),
    instrumentSymbol: (String(form.get("symbol") || "").trim() || null),
    instrumentExchange: String(form.get("exchange") || "NSE"),
    quantity: String(form.get("quantity") || "0"),
    unitPrice: String(form.get("unitPrice") || "0"),
    grossAmount: String(form.get("grossAmount") || "0"),
    feeAmount: String(form.get("feeAmount") || "0"),
    taxAmount: String(form.get("taxAmount") || "0"),
    currency: String(form.get("currency") || portfolio.baseCurrency),
    accountName: account.name,
    parseConfidence: 1,
    reconciliationState: "clean",
  };

  await ingestTransactions(portfolioId, [row]);
  await recomputeSnapshots(portfolioId, row.occurredAt, new Date(), portfolio.baseCurrency);
  await persistTaxLots(portfolioId);
  await writeAuditLog(user.id, "connection_change", { event: "manual_transaction_added", portfolioId, eventType: row.eventType });

  return NextResponse.redirect(new URL(`/portfolio/transactions?portfolio=${portfolioId}`, req.url), 303);
}
