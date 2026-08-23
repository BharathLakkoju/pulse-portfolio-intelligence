import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../src/lib/db";
import { ingestTransactions, type IngestableTransaction } from "../src/lib/ingest";

/**
 * Instructions.md §4: "Ingestion/connectors: idempotency tests — replaying
 * the same statement/API response must not create duplicate ledger rows
 * (test the dedupe hash, not just 'it ran twice')."
 */
describe("ingestTransactions idempotency", () => {
  let userId: string;
  let portfolioId: string;

  beforeAll(async () => {
    const user = await db.user.create({ data: { email: `ingest-test-${Date.now()}@pulse.test`, onboardingComplete: true } });
    userId = user.id;
    const portfolio = await db.portfolio.create({ data: { userId, name: "Idempotency Test Portfolio" } });
    portfolioId = portfolio.id;
  });

  afterAll(async () => {
    await db.transaction.deleteMany({ where: { portfolioId } });
    await db.account.deleteMany({ where: { portfolioId } });
    await db.portfolio.delete({ where: { id: portfolioId } });
    await db.user.delete({ where: { id: userId } });
  });

  const row: IngestableTransaction = {
    sourceId: "test_source",
    sourceTransactionId: "idempotency-row-1",
    occurredAt: new Date("2024-05-01"),
    eventType: "buy",
    instrumentSymbol: "IDEMPOTENCYTEST",
    instrumentExchange: "NSE",
    quantity: "10",
    unitPrice: "100",
    grossAmount: "1000",
    feeAmount: "0",
    taxAmount: "0",
    currency: "INR",
    accountName: "Idempotency Test Account",
  };

  it("inserts once on first ingest", async () => {
    const result = await ingestTransactions(portfolioId, [row]);
    expect(result.inserted).toBe(1);
    expect(result.duplicates).toBe(0);

    const count = await db.transaction.count({ where: { portfolioId, sourceTransactionId: "idempotency-row-1" } });
    expect(count).toBe(1);
  });

  it("does not create a duplicate row when the exact same statement/API response is replayed", async () => {
    const result = await ingestTransactions(portfolioId, [row]);
    expect(result.inserted).toBe(0);
    expect(result.duplicates).toBe(1);

    const count = await db.transaction.count({ where: { portfolioId, sourceTransactionId: "idempotency-row-1" } });
    expect(count).toBe(1);
  });

  it("still inserts a genuinely different transaction from the same source", async () => {
    const result = await ingestTransactions(portfolioId, [{ ...row, sourceTransactionId: "idempotency-row-2", grossAmount: "2000" }]);
    expect(result.inserted).toBe(1);
  });
});
