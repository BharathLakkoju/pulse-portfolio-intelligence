import Decimal from "decimal.js";
import { db } from "./db";
import { isoDate } from "./dates";

const OPEN_WITH_COST = new Set(["buy", "transfer_in"]);
const OPEN_AS_INCOME = new Set(["airdrop", "staking_reward"]);
const OPEN_NO_COST = new Set(["split", "merger", "spin_off"]);
const CLOSE = new Set(["sell", "transfer_out"]);

/**
 * Recomputes and stores one daily Snapshot row per day in [startDate, endDate]
 * by replaying the ledger against historical prices — in memory, in a single
 * pass, rather than one DB round-trip per day (that naive version doesn't
 * scale to a multi-year daily series). This stands in for the "Snapshot
 * service" / calc-engine worker job described in CLAUDE.md's core services
 * table — run on-demand here instead of via a queue, see QUESTIONS.md #1.
 */
export async function recomputeSnapshots(portfolioId: string, startDate: Date, endDate: Date, baseCurrency: string) {
  const transactions = await db.transaction.findMany({
    where: { portfolioId, instrumentId: { not: null }, occurredAt: { lte: endDate } },
    orderBy: { occurredAt: "asc" },
  });

  const instrumentIds = [...new Set(transactions.map((t) => t.instrumentId!))];
  const prices = await db.priceHistory.findMany({
    where: { instrumentId: { in: instrumentIds }, date: { lte: endDate } },
    orderBy: { date: "asc" },
  });
  const pricesByInstrument = new Map<string, { date: Date; close: Decimal }[]>();
  for (const p of prices) {
    const list = pricesByInstrument.get(p.instrumentId) ?? [];
    list.push({ date: p.date, close: new Decimal(p.close) });
    pricesByInstrument.set(p.instrumentId, list);
  }
  const pricePointer = new Map<string, number>();
  const latestPrice = new Map<string, Decimal>();

  function advancePrices(asOfDay: Date) {
    for (const instrumentId of instrumentIds) {
      const series = pricesByInstrument.get(instrumentId) ?? [];
      let idx = pricePointer.get(instrumentId) ?? 0;
      while (idx < series.length && series[idx].date <= asOfDay) {
        latestPrice.set(instrumentId, series[idx].close);
        idx++;
      }
      pricePointer.set(instrumentId, idx);
    }
  }

  interface PosAcc {
    quantity: Decimal;
    costBasisTotal: Decimal;
  }
  const positions = new Map<string, PosAcc>();
  let txIndex = 0;

  const rows: Array<{ date: Date; totalValue: string; investedValue: string }> = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dayEnd = new Date(cursor);
    dayEnd.setUTCHours(23, 59, 59, 999);

    while (txIndex < transactions.length && transactions[txIndex].occurredAt <= dayEnd) {
      const tx = transactions[txIndex];
      txIndex++;
      const instrumentId = tx.instrumentId!;
      let acc = positions.get(instrumentId);
      if (!acc) {
        acc = { quantity: new Decimal(0), costBasisTotal: new Decimal(0) };
        positions.set(instrumentId, acc);
      }
      const fx = tx.fxRateToBase ? new Decimal(tx.fxRateToBase) : new Decimal(1);
      const qty = new Decimal(tx.quantity).abs();
      const gross = new Decimal(tx.grossAmount).abs().times(fx);
      const fee = new Decimal(tx.feeAmount).abs().times(fx);

      if (OPEN_WITH_COST.has(tx.eventType)) {
        acc.quantity = acc.quantity.plus(qty);
        acc.costBasisTotal = acc.costBasisTotal.plus(gross).plus(fee);
      } else if (OPEN_AS_INCOME.has(tx.eventType)) {
        acc.quantity = acc.quantity.plus(qty);
        acc.costBasisTotal = acc.costBasisTotal.plus(gross);
      } else if (OPEN_NO_COST.has(tx.eventType)) {
        acc.quantity = acc.quantity.plus(qty);
      } else if (CLOSE.has(tx.eventType)) {
        const avgCost = acc.quantity.gt(0) ? acc.costBasisTotal.dividedBy(acc.quantity) : new Decimal(0);
        const sellQty = Decimal.min(qty, acc.quantity);
        acc.costBasisTotal = acc.costBasisTotal.minus(avgCost.times(sellQty));
        acc.quantity = acc.quantity.minus(sellQty);
      }
    }

    advancePrices(dayEnd);

    let totalValue = new Decimal(0);
    let investedValue = new Decimal(0);
    for (const [instrumentId, acc] of positions.entries()) {
      if (acc.quantity.lte(0)) continue;
      const price = latestPrice.get(instrumentId);
      if (price) totalValue = totalValue.plus(acc.quantity.times(price));
      investedValue = investedValue.plus(acc.costBasisTotal);
    }

    rows.push({ date: new Date(cursor), totalValue: totalValue.toFixed(2), investedValue: investedValue.toFixed(2) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  await db.snapshot.deleteMany({ where: { portfolioId, date: { gte: startDate, lte: endDate } } });
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.snapshot.createMany({
      data: rows.slice(i, i + BATCH).map((r) => ({ portfolioId, date: r.date, totalValue: r.totalValue, investedValue: r.investedValue, currency: baseCurrency })),
    });
  }
}

export interface SnapshotSeriesPoint {
  date: Date;
  totalValue: Decimal;
  investedValue: Decimal;
}

export async function getSnapshotSeries(portfolioId: string, startDate: Date, endDate: Date): Promise<SnapshotSeriesPoint[]> {
  const rows = await db.snapshot.findMany({
    where: { portfolioId, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({ date: r.date, totalValue: new Decimal(r.totalValue), investedValue: new Decimal(r.investedValue) }));
}

export async function getNearestSnapshot(portfolioId: string, date: Date): Promise<SnapshotSeriesPoint | null> {
  const row = await db.snapshot.findFirst({
    where: { portfolioId, date: { lte: date } },
    orderBy: { date: "desc" },
  });
  if (!row) return null;
  return { date: row.date, totalValue: new Decimal(row.totalValue), investedValue: new Decimal(row.investedValue) };
}

export { isoDate };
