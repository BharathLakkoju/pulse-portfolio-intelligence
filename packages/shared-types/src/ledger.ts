/**
 * Canonical transaction ledger shape — see CLAUDE.md "Canonical transaction
 * ledger" section. Every ingested record, regardless of source, normalizes
 * to this shape. Do not diverge from it; extend via optional fields only.
 *
 * Money/quantity fields are strings holding decimal text (parsed only via
 * decimal.js in application code) — never native floats — per CLAUDE.md's
 * decimal-safety rule.
 */

export type EventType =
  | "buy"
  | "sell"
  | "dividend"
  | "interest"
  | "fee"
  | "transfer_in"
  | "transfer_out"
  | "split"
  | "merger"
  | "spin_off"
  | "airdrop"
  | "staking_reward"
  | "withholding_tax"
  | "FX_conversion";

export type ReconciliationState =
  | "clean"
  | "needs_review"
  | "duplicate_suspected"
  | "resolved"
  | "corrected";

export interface LedgerTransaction {
  transactionId: string;
  portfolioId: string;
  accountId: string;
  sourceId: string;
  sourceTransactionId: string | null;

  occurredAt: string; // ISO 8601, UTC
  settledAt: string | null;
  importedAt: string;
  timezone: string; // IANA tz of the source event, e.g. "Asia/Kolkata"

  eventType: EventType;

  instrumentId: string | null; // null for pure cash events
  quantity: string; // decimal string
  unitPrice: string; // decimal string
  grossAmount: string; // decimal string, in `currency`
  feeAmount: string; // decimal string
  taxAmount: string; // decimal string
  currency: string; // ISO 4217

  fxRateToBase: string | null; // decimal string
  sourceDocumentRef: string | null;
  parseConfidence: number; // 0..1
  reconciliationState: ReconciliationState;

  rawPayloadRef: string | null; // pointer to encrypted raw source payload

  correctsTransactionId: string | null; // set on adjustment/audit records
  dedupeHash: string;
}

export type PriceLabel = "live" | "delayed" | "eod" | "stale" | "unavailable" | "synthetic";

export type AssetClass =
  | "equity"
  | "etf"
  | "mutual_fund"
  | "crypto"
  | "cash"
  | "fixed_deposit"
  | "bond"
  | "gold"
  | "real_estate"
  | "other";

export type ConnectionStatus =
  | "healthy"
  | "delayed"
  | "reconnect_required"
  | "partial_data"
  | "failed"
  | "retired";

export type ReturnMethod = "simple" | "xirr" | "twrr" | "cagr" | "unavailable";

/**
 * Every user-visible metric response must be able to answer these fields on
 * demand — CLAUDE.md principle 2 / Instructions.md §5 "Definition of done".
 */
export interface MetricExplainability {
  formula: string;
  method: ReturnMethod | string;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  baseCurrency: string;
  fxApproach: string;
  benchmark: string | null;
  riskFreeRateAssumption: number | null;
  annualisationMethod: string | null;
  includedAccountIds: string[];
  excludedAccountIds: string[];
  dataQualityWarnings: string[];
  asOf: string;
}

export interface MetricResult<T> {
  value: T | null;
  unavailableReason: string | null;
  explain: MetricExplainability;
}
