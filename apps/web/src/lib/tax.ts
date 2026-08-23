import Decimal from "decimal.js";
import { db } from "./db";
import { REGION_TAX_CONFIG } from "@pulse/shared-types";
import { indiaFinancialYear } from "./dates";

interface OpenLot {
  instrumentId: string;
  assetClass: string;
  acquiredAt: Date;
  openTransactionId: string;
  quantityRemaining: Decimal;
  costBasisPerUnit: Decimal;
  currency: string;
}

interface ClosedLotRecord {
  instrumentId: string;
  symbol: string;
  assetClass: string;
  acquiredAt: Date;
  closedAt: Date;
  openTransactionId: string;
  closeTransactionId: string;
  quantity: Decimal;
  costBasisPerUnit: Decimal;
  proceedsPerUnit: Decimal;
  realizedGain: Decimal;
  holdingPeriodDays: number;
  holdingPeriod: "short_term" | "long_term";
  financialYear: string;
  currency: string;
}

const OPENING_EVENTS = new Set(["buy", "transfer_in", "airdrop", "staking_reward"]);
const CLOSING_EVENTS = new Set(["sell", "transfer_out"]);

/**
 * FIFO cost-basis engine (region-configurable — see region-config.ts). This
 * recomputes a derived view from the immutable ledger; it never mutates
 * ledger rows. India v1 only — CA review pending, see QUESTIONS.md #8.
 */
export async function computeFifoLots(portfolioId: string, regionCode = "IN") {
  const config = REGION_TAX_CONFIG[regionCode] ?? REGION_TAX_CONFIG.IN;
  const transactions = await db.transaction.findMany({
    where: { portfolioId, instrumentId: { not: null } },
    include: { instrument: true },
    orderBy: { occurredAt: "asc" },
  });

  const openLotsByInstrument = new Map<string, OpenLot[]>();
  const closedLots: ClosedLotRecord[] = [];

  for (const tx of transactions) {
    if (!tx.instrument) continue;
    const fx = tx.fxRateToBase ? new Decimal(tx.fxRateToBase) : new Decimal(1);
    const qty = new Decimal(tx.quantity).abs();
    const gross = new Decimal(tx.grossAmount).abs().times(fx);
    const fee = new Decimal(tx.feeAmount).abs().times(fx);

    if (OPENING_EVENTS.has(tx.eventType)) {
      const list = openLotsByInstrument.get(tx.instrumentId!) ?? [];
      const costPerUnit = qty.gt(0) ? gross.plus(fee).dividedBy(qty) : new Decimal(0);
      list.push({
        instrumentId: tx.instrumentId!,
        assetClass: tx.instrument.assetClass,
        acquiredAt: tx.occurredAt,
        openTransactionId: tx.id,
        quantityRemaining: qty,
        costBasisPerUnit: costPerUnit,
        currency: tx.currency,
      });
      openLotsByInstrument.set(tx.instrumentId!, list);
    } else if (CLOSING_EVENTS.has(tx.eventType)) {
      const list = openLotsByInstrument.get(tx.instrumentId!) ?? [];
      let remainingToClose = qty;
      const proceedsPerUnit = qty.gt(0) ? gross.minus(fee).dividedBy(qty) : new Decimal(0);
      const rule = config.holdingPeriodRules.find((r) => r.assetClass === tx.instrument!.assetClass);
      const thresholdDays = rule?.longTermThresholdDays ?? 365;

      while (remainingToClose.gt(0) && list.length > 0) {
        const lot = list[0];
        const consumeQty = Decimal.min(lot.quantityRemaining, remainingToClose);
        const holdingDays = Math.round((tx.occurredAt.getTime() - lot.acquiredAt.getTime()) / (1000 * 60 * 60 * 24));
        const gain = proceedsPerUnit.minus(lot.costBasisPerUnit).times(consumeQty);

        closedLots.push({
          instrumentId: tx.instrumentId!,
          symbol: tx.instrument.symbol,
          assetClass: tx.instrument.assetClass,
          acquiredAt: lot.acquiredAt,
          closedAt: tx.occurredAt,
          openTransactionId: lot.openTransactionId,
          closeTransactionId: tx.id,
          quantity: consumeQty,
          costBasisPerUnit: lot.costBasisPerUnit,
          proceedsPerUnit,
          realizedGain: gain,
          holdingPeriodDays: holdingDays,
          holdingPeriod: holdingDays >= thresholdDays ? "long_term" : "short_term",
          financialYear: indiaFinancialYear(tx.occurredAt),
          currency: tx.currency,
        });

        lot.quantityRemaining = lot.quantityRemaining.minus(consumeQty);
        remainingToClose = remainingToClose.minus(consumeQty);
        if (lot.quantityRemaining.lte(0)) list.shift();
      }
      openLotsByInstrument.set(tx.instrumentId!, list);
    }
  }

  const openLots: OpenLot[] = [...openLotsByInstrument.values()].flat().filter((l) => l.quantityRemaining.gt(0));

  return { openLots, closedLots, config };
}

export interface CapitalGainsSummary {
  financialYear: string;
  shortTermGain: Decimal;
  longTermGain: Decimal;
  byAssetClass: Record<string, { shortTerm: Decimal; longTerm: Decimal }>;
}

export function summarizeGainsByFY(closedLots: Awaited<ReturnType<typeof computeFifoLots>>["closedLots"]): CapitalGainsSummary[] {
  const byFY = new Map<string, CapitalGainsSummary>();
  for (const lot of closedLots) {
    let summary = byFY.get(lot.financialYear);
    if (!summary) {
      summary = { financialYear: lot.financialYear, shortTermGain: new Decimal(0), longTermGain: new Decimal(0), byAssetClass: {} };
      byFY.set(lot.financialYear, summary);
    }
    if (!summary.byAssetClass[lot.assetClass]) {
      summary.byAssetClass[lot.assetClass] = { shortTerm: new Decimal(0), longTerm: new Decimal(0) };
    }
    if (lot.holdingPeriod === "short_term") {
      summary.shortTermGain = summary.shortTermGain.plus(lot.realizedGain);
      summary.byAssetClass[lot.assetClass].shortTerm = summary.byAssetClass[lot.assetClass].shortTerm.plus(lot.realizedGain);
    } else {
      summary.longTermGain = summary.longTermGain.plus(lot.realizedGain);
      summary.byAssetClass[lot.assetClass].longTerm = summary.byAssetClass[lot.assetClass].longTerm.plus(lot.realizedGain);
    }
  }
  return [...byFY.values()].sort((a, b) => (a.financialYear < b.financialYear ? 1 : -1));
}

export async function persistTaxLots(portfolioId: string) {
  const { openLots, closedLots } = await computeFifoLots(portfolioId);
  await db.taxLot.deleteMany({ where: { portfolioId } });
  await db.taxLot.createMany({
    data: [
      ...openLots.map((l) => ({
        portfolioId,
        instrumentId: l.instrumentId,
        openTransactionId: l.openTransactionId,
        acquiredAt: l.acquiredAt,
        quantityOriginal: l.quantityRemaining.toFixed(8),
        quantityRemaining: l.quantityRemaining.toFixed(8),
        costBasisPerUnit: l.costBasisPerUnit.toFixed(4),
        currency: l.currency,
      })),
      ...closedLots.map((l) => ({
        portfolioId,
        instrumentId: l.instrumentId,
        openTransactionId: l.openTransactionId,
        acquiredAt: l.acquiredAt,
        quantityOriginal: l.quantity.toFixed(8),
        quantityRemaining: "0",
        costBasisPerUnit: l.costBasisPerUnit.toFixed(4),
        currency: l.currency,
        closedAt: l.closedAt,
        closeTransactionId: l.closeTransactionId,
        realizedGain: l.realizedGain.toFixed(2),
        holdingPeriod: l.holdingPeriod,
      })),
    ],
  });
}
