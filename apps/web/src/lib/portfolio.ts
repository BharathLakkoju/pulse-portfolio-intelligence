import Decimal from "decimal.js";
import { db } from "./db";
import type { PriceLabel } from "@pulse/shared-types";

const D = (v: string | number | null | undefined) => new Decimal(v ?? 0);

export interface PriceQuote {
  price: Decimal;
  date: Date;
  label: PriceLabel;
}

/** Latest price at or before `asOfDate`. Returns null (unavailable) if no price exists yet. */
export async function getPriceAsOf(instrumentId: string, asOfDate: Date): Promise<PriceQuote | null> {
  const row = await db.priceHistory.findFirst({
    where: { instrumentId, date: { lte: asOfDate } },
    orderBy: { date: "desc" },
  });
  if (!row) return null;
  const ageDays = (asOfDate.getTime() - row.date.getTime()) / (1000 * 60 * 60 * 24);
  let label: PriceLabel = row.isSynthetic ? "synthetic" : "eod";
  if (!row.isSynthetic) {
    if (ageDays > 5) label = "stale";
    else if (ageDays > 1) label = "delayed";
  }
  return { price: D(row.close), date: row.date, label };
}

export interface PositionKey {
  accountId: string;
  accountName: string;
  instrumentId: string;
}

export interface PositionRow extends PositionKey {
  symbol: string;
  name: string;
  assetClass: string;
  sector: string | null;
  exchange: string;
  country: string;
  currency: string;
  quantity: Decimal;
  investedValue: Decimal; // remaining cost basis in base currency
  avgCostPerUnit: Decimal;
  realizedGain: Decimal;
  realizedProceeds: Decimal;
  income: Decimal;
  fees: Decimal;
  taxes: Decimal;
  contributions: Decimal;
  withdrawals: Decimal;
  currentPrice: Decimal | null;
  priceLabel: PriceLabel;
  currentValue: Decimal;
  unrealizedPnl: Decimal;
  returnPct: number | null;
}

const EVENTS_ADD_WITH_COST = new Set(["buy", "transfer_in"]);
const EVENTS_ADD_AS_INCOME = new Set(["airdrop", "staking_reward"]);
const EVENTS_ADD_NO_COST = new Set(["split", "merger", "spin_off"]);
const EVENTS_REDUCE = new Set(["sell", "transfer_out"]);

export interface ComputePositionsOptions {
  asOfDate?: Date;
  accountIds?: string[];
}

/**
 * Replays the immutable ledger up to `asOfDate` and returns one row per
 * (account, instrument). Money math uses decimal.js throughout — never
 * native floats — per CLAUDE.md.
 */
export async function computePositions(portfolioId: string, opts: ComputePositionsOptions = {}): Promise<PositionRow[]> {
  const asOfDate = opts.asOfDate ?? new Date();

  const transactions = await db.transaction.findMany({
    where: {
      portfolioId,
      occurredAt: { lte: asOfDate },
      instrumentId: { not: null },
      ...(opts.accountIds ? { accountId: { in: opts.accountIds } } : {}),
    },
    include: { instrument: true, account: true },
    orderBy: { occurredAt: "asc" },
  });

  type Acc = {
    key: PositionKey;
    instrument: NonNullable<(typeof transactions)[number]["instrument"]>;
    quantity: Decimal;
    costBasisTotal: Decimal;
    realizedGain: Decimal;
    realizedProceeds: Decimal;
    income: Decimal;
    fees: Decimal;
    taxes: Decimal;
    contributions: Decimal;
    withdrawals: Decimal;
  };

  const groups = new Map<string, Acc>();

  for (const tx of transactions) {
    if (!tx.instrument) continue;
    const key = `${tx.accountId}::${tx.instrumentId}`;
    let acc = groups.get(key);
    if (!acc) {
      acc = {
        key: { accountId: tx.accountId, accountName: tx.account.name, instrumentId: tx.instrumentId! },
        instrument: tx.instrument,
        quantity: new Decimal(0),
        costBasisTotal: new Decimal(0),
        realizedGain: new Decimal(0),
        realizedProceeds: new Decimal(0),
        income: new Decimal(0),
        fees: new Decimal(0),
        taxes: new Decimal(0),
        contributions: new Decimal(0),
        withdrawals: new Decimal(0),
      };
      groups.set(key, acc);
    }

    const fx = tx.fxRateToBase ? D(tx.fxRateToBase) : new Decimal(1);
    const qty = D(tx.quantity).abs();
    const gross = D(tx.grossAmount).abs().times(fx);
    const fee = D(tx.feeAmount).abs().times(fx);
    const tax = D(tx.taxAmount).abs().times(fx);

    if (EVENTS_ADD_WITH_COST.has(tx.eventType)) {
      acc.quantity = acc.quantity.plus(qty);
      acc.costBasisTotal = acc.costBasisTotal.plus(gross).plus(fee);
      acc.fees = acc.fees.plus(fee);
      if (tx.eventType === "buy") acc.contributions = acc.contributions.plus(gross);
      else acc.contributions = acc.contributions.plus(gross); // transfer_in also brings new value into scope
    } else if (EVENTS_ADD_AS_INCOME.has(tx.eventType)) {
      acc.quantity = acc.quantity.plus(qty);
      acc.costBasisTotal = acc.costBasisTotal.plus(gross);
      acc.income = acc.income.plus(gross);
    } else if (EVENTS_ADD_NO_COST.has(tx.eventType)) {
      acc.quantity = acc.quantity.plus(qty);
    } else if (EVENTS_REDUCE.has(tx.eventType)) {
      const avgCost = acc.quantity.gt(0) ? acc.costBasisTotal.dividedBy(acc.quantity) : new Decimal(0);
      const sellQty = Decimal.min(qty, acc.quantity);
      const costRemoved = avgCost.times(sellQty);

      if (tx.eventType === "sell") {
        const netProceeds = gross.minus(fee).minus(tax);
        acc.realizedProceeds = acc.realizedProceeds.plus(netProceeds);
        acc.realizedGain = acc.realizedGain.plus(netProceeds.minus(costRemoved));
        acc.fees = acc.fees.plus(fee);
        acc.taxes = acc.taxes.plus(tax);
      } else {
        // transfer_out: capital leaving this portfolio's scope, not a sale.
        acc.withdrawals = acc.withdrawals.plus(costRemoved);
      }
      acc.costBasisTotal = acc.costBasisTotal.minus(costRemoved);
      acc.quantity = acc.quantity.minus(sellQty);
    } else if (tx.eventType === "dividend" || tx.eventType === "interest") {
      acc.income = acc.income.plus(gross.minus(tax));
      acc.taxes = acc.taxes.plus(tax);
    } else if (tx.eventType === "fee") {
      acc.fees = acc.fees.plus(gross);
    } else if (tx.eventType === "withholding_tax") {
      acc.taxes = acc.taxes.plus(gross);
    }
    // FX_conversion: cash-only, not modeled at position level.
  }

  const results: PositionRow[] = [];
  for (const acc of groups.values()) {
    const quote = await getPriceAsOf(acc.key.instrumentId, asOfDate);
    const currentPrice = quote?.price ?? null;
    const currentValue = currentPrice ? acc.quantity.times(currentPrice) : new Decimal(0);
    const avgCostPerUnit = acc.quantity.gt(0) ? acc.costBasisTotal.dividedBy(acc.quantity) : new Decimal(0);
    const unrealizedPnl = currentValue.minus(acc.costBasisTotal);
    const returnPct = acc.costBasisTotal.gt(0) ? unrealizedPnl.dividedBy(acc.costBasisTotal).times(100).toNumber() : null;

    results.push({
      ...acc.key,
      symbol: acc.instrument.symbol,
      name: acc.instrument.name,
      assetClass: acc.instrument.assetClass,
      sector: acc.instrument.sector,
      exchange: acc.instrument.exchange,
      country: acc.instrument.country,
      currency: acc.instrument.currency,
      quantity: acc.quantity,
      investedValue: acc.costBasisTotal,
      avgCostPerUnit,
      realizedGain: acc.realizedGain,
      realizedProceeds: acc.realizedProceeds,
      income: acc.income,
      fees: acc.fees,
      taxes: acc.taxes,
      contributions: acc.contributions,
      withdrawals: acc.withdrawals,
      currentPrice,
      priceLabel: currentPrice ? quote!.label : "unavailable",
      currentValue,
      unrealizedPnl,
      returnPct,
    });
  }

  return results;
}

export interface PortfolioTotals {
  currentValue: Decimal;
  investedValue: Decimal;
  realizedGain: Decimal;
  realizedProceeds: Decimal;
  income: Decimal;
  fees: Decimal;
  taxes: Decimal;
  netContributions: Decimal;
  totalPnl: Decimal;
  unpricedValue: Decimal; // invested value of positions with no price available
}

export function aggregateTotals(positions: PositionRow[]): PortfolioTotals {
  const zero = new Decimal(0);
  const currentValue = positions.reduce((s, p) => s.plus(p.currentValue), zero);
  const investedValue = positions.reduce((s, p) => (p.quantity.gt(0) ? s.plus(p.investedValue) : s), zero);
  const realizedGain = positions.reduce((s, p) => s.plus(p.realizedGain), zero);
  const realizedProceeds = positions.reduce((s, p) => s.plus(p.realizedProceeds), zero);
  const income = positions.reduce((s, p) => s.plus(p.income), zero);
  const fees = positions.reduce((s, p) => s.plus(p.fees), zero);
  const taxes = positions.reduce((s, p) => s.plus(p.taxes), zero);
  const contributions = positions.reduce((s, p) => s.plus(p.contributions), zero);
  const withdrawals = positions.reduce((s, p) => s.plus(p.withdrawals), zero);
  const netContributions = contributions.minus(withdrawals);
  const unpricedValue = positions.reduce(
    (s, p) => (p.quantity.gt(0) && p.priceLabel === "unavailable" ? s.plus(p.investedValue) : s),
    zero,
  );

  const totalPnl = currentValue.plus(realizedProceeds).plus(income).minus(netContributions).minus(fees).minus(taxes);

  return { currentValue, investedValue, realizedGain, realizedProceeds, income, fees, taxes, netContributions, totalPnl, unpricedValue };
}

export function groupBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const k = keyFn(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

/** Merges per-account position rows into per-instrument rows (portfolio-wide holdings view). */
export function aggregateByInstrument(positions: PositionRow[]): PositionRow[] {
  const byInstrument = groupBy(
    positions.filter((p) => p.quantity.gt(0)),
    (p) => p.instrumentId,
  );
  return Object.values(byInstrument).map((rows) => {
    const first = rows[0];
    const quantity = rows.reduce((s, r) => s.plus(r.quantity), new Decimal(0));
    const investedValue = rows.reduce((s, r) => s.plus(r.investedValue), new Decimal(0));
    const currentValue = rows.reduce((s, r) => s.plus(r.currentValue), new Decimal(0));
    const unrealizedPnl = currentValue.minus(investedValue);
    return {
      ...first,
      accountId: "ALL",
      accountName: "All accounts",
      quantity,
      investedValue,
      avgCostPerUnit: quantity.gt(0) ? investedValue.dividedBy(quantity) : new Decimal(0),
      currentValue,
      unrealizedPnl,
      returnPct: investedValue.gt(0) ? unrealizedPnl.dividedBy(investedValue).times(100).toNumber() : null,
    };
  });
}
