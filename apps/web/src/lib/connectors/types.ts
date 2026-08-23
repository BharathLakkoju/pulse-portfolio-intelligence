import type { IngestableTransaction } from "../ingest";

/**
 * Adapter seam a real broker/exchange OAuth connector would implement.
 * Every connector is read-only by construction — there is no `place_order`
 * or `withdraw` method on this interface, matching CLAUDE.md principle 1.
 * See QUESTIONS.md #3 for why only demo adapters exist today.
 */
export interface ConnectorScope {
  id: string;
  label: string;
  readOnly: true;
}

export interface ConnectorDefinition {
  id: string;
  displayName: string;
  kind: "broker" | "crypto_exchange" | "mutual_fund" | "bank";
  isDemo: boolean;
  scopes: ConnectorScope[];
  /** Generates the transactions a real sync would pull, for the given account label. */
  fetchTransactions(accountName: string): Promise<IngestableTransaction[]>;
}
