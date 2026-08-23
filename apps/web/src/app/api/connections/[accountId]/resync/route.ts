import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getConnector } from "@/lib/connectors/registry";
import { ingestTransactions } from "@/lib/ingest";
import { recomputeSnapshots } from "@/lib/snapshots";
import { persistTaxLots } from "@/lib/tax";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { accountId: string } }) {
  const user = await requireUser();
  const account = await db.account.findFirst({ where: { id: params.accountId, portfolio: { userId: user.id } } });
  const connector = account ? getConnector(account.provider) : null;
  if (!account || !connector) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const portfolio = await db.portfolio.findUniqueOrThrow({ where: { id: account.portfolioId } });
  const rows = await connector.fetchTransactions(account.name);
  const result = await ingestTransactions(account.portfolioId, rows);

  if (result.inserted > 0) {
    const earliest = rows.reduce((min, r) => (r.occurredAt < min ? r.occurredAt : min), rows[0].occurredAt);
    await recomputeSnapshots(account.portfolioId, earliest, new Date(), portfolio.baseCurrency);
    await persistTaxLots(account.portfolioId);
  }

  await db.account.update({ where: { id: account.id }, data: { lastSyncAt: new Date(), status: "healthy" } });
  await writeAuditLog(user.id, "connection_change", { event: "resynced", accountId: account.id, inserted: result.inserted, duplicates: result.duplicates });

  return NextResponse.redirect(new URL(`/connections?portfolio=${account.portfolioId}`, req.url), 303);
}
