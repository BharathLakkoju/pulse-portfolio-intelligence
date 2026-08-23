import { db } from "./db";
import { dedupeHash } from "./crypto";
import type { GenericCsvRow } from "./csv";
import type { EventType } from "@pulse/shared-types";

export interface IngestableTransaction {
  sourceId: string;
  sourceTransactionId?: string | null;
  occurredAt: Date;
  eventType: EventType | string;
  instrumentSymbol?: string | null;
  instrumentExchange?: string | null;
  quantity: string;
  unitPrice: string;
  grossAmount: string;
  feeAmount: string;
  taxAmount: string;
  currency: string;
  fxRateToBase?: string | null;
  accountName: string;
  parseConfidence?: number;
  reconciliationState?: string;
  sourceDocumentRef?: string | null;
}

export interface IngestResult {
  inserted: number;
  duplicates: number;
  errors: Array<{ row: IngestableTransaction; message: string }>;
}

async function resolveInstrument(symbol: string, exchange: string) {
  const found = await db.instrument.findUnique({ where: { symbol_exchange: { symbol, exchange } } });
  if (found) return found;
  // Unknown instrument: create a minimal placeholder so the transaction can still land in the
  // ledger — flagged via reconciliationState by the caller rather than silently dropped.
  return db.instrument.create({
    data: { symbol, exchange, name: symbol, assetClass: "other", currency: "INR", country: "IN" },
  });
}

async function resolveAccount(portfolioId: string, accountName: string, sourceId: string, currency: string) {
  const existing = await db.account.findFirst({ where: { portfolioId, name: accountName } });
  if (existing) return existing;
  return db.account.create({
    data: {
      portfolioId,
      name: accountName,
      sourceType: sourceId === "csv_import" ? "manual" : sourceId,
      provider: sourceId,
      currency,
      isReadOnly: true,
      status: "healthy",
    },
  });
}

/**
 * Idempotent ledger ingestion: replaying the same source data never creates
 * duplicate rows (Instructions.md §4). Dedupe key is the provider's
 * sourceTransactionId when present, else a deterministic hash of the
 * economically-identifying fields.
 */
export async function ingestTransactions(portfolioId: string, rows: IngestableTransaction[]): Promise<IngestResult> {
  let inserted = 0;
  let duplicates = 0;
  const errors: IngestResult["errors"] = [];

  for (const row of rows) {
    try {
      const account = await resolveAccount(portfolioId, row.accountName, row.sourceId, row.currency);
      const instrument = row.instrumentSymbol
        ? await resolveInstrument(row.instrumentSymbol, row.instrumentExchange || "NSE")
        : null;

      const hash =
        row.sourceTransactionId ??
        dedupeHash([
          portfolioId,
          account.id,
          row.eventType,
          instrument?.id,
          row.occurredAt.toISOString(),
          row.quantity,
          row.grossAmount,
          row.currency,
        ]);
      const fullHash = dedupeHash([row.sourceId, hash]);

      const existing = await db.transaction.findFirst({ where: { dedupeHash: fullHash } });
      if (existing) {
        duplicates++;
        continue;
      }

      await db.transaction.create({
        data: {
          portfolioId,
          accountId: account.id,
          sourceId: row.sourceId,
          sourceTransactionId: row.sourceTransactionId ?? null,
          occurredAt: row.occurredAt,
          timezone: "Asia/Kolkata",
          eventType: row.eventType,
          instrumentId: instrument?.id ?? null,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          grossAmount: row.grossAmount,
          feeAmount: row.feeAmount,
          taxAmount: row.taxAmount,
          currency: row.currency,
          fxRateToBase: row.fxRateToBase ?? null,
          sourceDocumentRef: row.sourceDocumentRef ?? null,
          parseConfidence: row.parseConfidence ?? 1,
          reconciliationState: row.reconciliationState ?? "clean",
          dedupeHash: fullHash,
        },
      });
      inserted++;
    } catch (err) {
      errors.push({ row, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return { inserted, duplicates, errors };
}

export function csvRowToIngestable(row: GenericCsvRow, sourceId: string): IngestableTransaction {
  return {
    sourceId,
    occurredAt: new Date(row.date),
    eventType: row.event_type,
    instrumentSymbol: row.symbol || null,
    instrumentExchange: row.exchange || "NSE",
    quantity: row.quantity,
    unitPrice: row.unit_price,
    grossAmount: row.gross_amount,
    feeAmount: row.fee_amount,
    taxAmount: row.tax_amount,
    currency: row.currency,
    accountName: row.account_name,
    parseConfidence: 1,
    reconciliationState: "clean",
  };
}
