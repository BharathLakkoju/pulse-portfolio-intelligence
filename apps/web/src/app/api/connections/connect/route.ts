import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getConnector } from "@/lib/connectors/registry";
import { ingestTransactions } from "@/lib/ingest";
import { recomputeSnapshots } from "@/lib/snapshots";
import { persistTaxLots } from "@/lib/tax";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();
  const portfolioId = String(form.get("portfolioId") || "");
  const connectorId = String(form.get("connectorId") || "");
  const nickname = String(form.get("accountName") || "").trim();

  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  const connector = getConnector(connectorId);
  if (!portfolio || !connector) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const accountName = nickname || connector.displayName;
  const account = await db.account.create({
    data: {
      portfolioId,
      name: accountName,
      sourceType: connector.kind,
      provider: connector.id,
      currency: portfolio.baseCurrency,
      isReadOnly: true,
      isDemo: connector.isDemo,
      status: "healthy",
      scopesGranted: connector.scopes.map((s) => s.id).join(","),
      lastSyncAt: new Date(),
    },
  });

  const rows = await connector.fetchTransactions(accountName);
  const result = await ingestTransactions(portfolioId, rows);

  if (rows.length > 0) {
    const earliest = rows.reduce((min, r) => (r.occurredAt < min ? r.occurredAt : min), rows[0].occurredAt);
    await recomputeSnapshots(portfolioId, earliest, new Date(), portfolio.baseCurrency);
    await persistTaxLots(portfolioId);
  }

  await writeAuditLog(user.id, "connection_change", { event: "connected", accountId: account.id, connectorId, inserted: result.inserted });

  return NextResponse.redirect(new URL(`/connections?portfolio=${portfolioId}`, req.url), 303);
}
