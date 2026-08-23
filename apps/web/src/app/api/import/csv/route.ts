import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { parseGenericTransactionCsv } from "@/lib/csv";
import { csvRowToIngestable, ingestTransactions } from "@/lib/ingest";
import { recomputeSnapshots } from "@/lib/snapshots";
import { persistTaxLots } from "@/lib/tax";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();
  const portfolioId = String(form.get("portfolioId") || "");
  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

  const file = form.get("file") as File | null;
  if (!file) return NextResponse.redirect(new URL(`/portfolio/transactions?portfolio=${portfolioId}`, req.url), 303);

  const text = await file.text();
  const { valid, errors } = parseGenericTransactionCsv(text);

  const rows = valid.map((r) => csvRowToIngestable(r, "csv_import"));
  const result = rows.length > 0 ? await ingestTransactions(portfolioId, rows) : { inserted: 0, duplicates: 0, errors: [] };

  if (rows.length > 0) {
    const earliest = rows.reduce((min, r) => (r.occurredAt < min ? r.occurredAt : min), rows[0].occurredAt);
    await recomputeSnapshots(portfolioId, earliest, new Date(), portfolio.baseCurrency);
    await persistTaxLots(portfolioId);
  }

  await writeAuditLog(user.id, "connection_change", {
    event: "csv_import",
    portfolioId,
    filename: file.name,
    validRows: valid.length,
    invalidRows: errors.length,
    inserted: result.inserted,
    duplicates: result.duplicates,
  });

  const summary = encodeURIComponent(`Imported ${result.inserted}, skipped ${result.duplicates} duplicate(s), ${errors.length} row error(s).`);
  return NextResponse.redirect(new URL(`/portfolio/transactions?portfolio=${portfolioId}&importSummary=${summary}`, req.url), 303);
}
