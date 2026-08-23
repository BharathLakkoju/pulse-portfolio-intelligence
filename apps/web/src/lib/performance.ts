import Decimal from "decimal.js";
import { xirr, cagr, twrr, type CashFlow } from "@pulse/calc-engine";
import type { MetricExplainability, MetricResult, ReturnMethod } from "@pulse/shared-types";
import { db } from "./db";
import { aggregateTotals, computePositions } from "./portfolio";
import { getSnapshotSeries, getNearestSnapshot } from "./snapshots";

function baseExplain(overrides: Partial<MetricExplainability> & { formula: string; method: string; baseCurrency: string }): MetricExplainability {
  return {
    dateRangeStart: null,
    dateRangeEnd: null,
    benchmark: null,
    riskFreeRateAssumption: null,
    annualisationMethod: null,
    includedAccountIds: [],
    excludedAccountIds: [],
    dataQualityWarnings: [],
    fxApproach: "Transaction-level fxRateToBase applied at time of each cash flow; no retrospective FX smoothing.",
    asOf: new Date().toISOString(),
    ...overrides,
  };
}

export async function computeXirr(portfolioId: string, baseCurrency: string, asOfDate = new Date()): Promise<MetricResult<number>> {
  const transactions = await db.transaction.findMany({
    where: { portfolioId, occurredAt: { lte: asOfDate } },
    orderBy: { occurredAt: "asc" },
  });

  const warnings: string[] = [];
  const flows: CashFlow[] = [];
  for (const tx of transactions) {
    const fx = tx.fxRateToBase ? new Decimal(tx.fxRateToBase) : new Decimal(1);
    const gross = new Decimal(tx.grossAmount).abs().times(fx);
    const fee = new Decimal(tx.feeAmount).abs().times(fx);
    const tax = new Decimal(tx.taxAmount).abs().times(fx);
    if (tx.eventType === "buy" || tx.eventType === "transfer_in") {
      flows.push({ date: tx.occurredAt, amount: -gross.plus(fee).toNumber() });
    } else if (tx.eventType === "sell" || tx.eventType === "transfer_out") {
      flows.push({ date: tx.occurredAt, amount: gross.minus(fee).minus(tax).toNumber() });
    } else if (tx.eventType === "dividend" || tx.eventType === "interest") {
      flows.push({ date: tx.occurredAt, amount: gross.minus(tax).toNumber() });
    } else if (tx.eventType === "fee") {
      flows.push({ date: tx.occurredAt, amount: -gross.toNumber() });
    }
    if (!tx.fxRateToBase && tx.currency !== baseCurrency) {
      warnings.push(`Transaction ${tx.id} in ${tx.currency} has no fxRateToBase; assumed 1:1 with ${baseCurrency}.`);
    }
  }

  const positions = await computePositions(portfolioId, { asOfDate });
  const totals = aggregateTotals(positions);
  if (totals.currentValue.gt(0)) {
    flows.push({ date: asOfDate, amount: totals.currentValue.toNumber() });
  }

  const explain = baseExplain({
    formula: "Solve r in: sum(CF_k / (1+r)^((d_k - d_0)/365)) = 0, using signed external cash flows plus a terminal flow equal to current portfolio value.",
    method: "xirr" as ReturnMethod,
    baseCurrency,
    dateRangeEnd: asOfDate.toISOString(),
    dataQualityWarnings: warnings,
  });

  const result = xirr(flows);
  if (result.status === "unavailable") {
    return { value: null, unavailableReason: result.reason, explain };
  }
  return { value: result.rate, unavailableReason: null, explain };
}

export async function computeCagr(portfolioId: string, baseCurrency: string, startDate: Date, endDate: Date): Promise<MetricResult<number>> {
  const begin = await getNearestSnapshot(portfolioId, startDate);
  const end = await getNearestSnapshot(portfolioId, endDate);
  const explain = baseExplain({
    formula: "CAGR = (End Value / Begin Value)^(1/years) - 1",
    method: "cagr" as ReturnMethod,
    baseCurrency,
    dateRangeStart: startDate.toISOString(),
    dateRangeEnd: endDate.toISOString(),
    annualisationMethod: "365-day year",
  });
  if (!begin || !end) {
    return { value: null, unavailableReason: "Not enough daily history recomputed for this date range yet.", explain };
  }
  const years = (end.date.getTime() - begin.date.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const result = cagr(begin.totalValue.toNumber(), end.totalValue.toNumber(), years);
  if (result.status === "unavailable") return { value: null, unavailableReason: result.reason, explain };
  return { value: result.rate, unavailableReason: null, explain };
}

export async function computeTwrr(portfolioId: string, baseCurrency: string, startDate: Date, endDate: Date): Promise<MetricResult<number>> {
  const series = await getSnapshotSeries(portfolioId, startDate, endDate);
  const explain = baseExplain({
    formula: "Chain-linked daily holding-period returns, each period's external cash flow removed before linking.",
    method: "twrr" as ReturnMethod,
    baseCurrency,
    dateRangeStart: startDate.toISOString(),
    dateRangeEnd: endDate.toISOString(),
    annualisationMethod: "Not annualised — cumulative return over the selected period.",
  });
  if (series.length < 2) {
    return { value: null, unavailableReason: "Fewer than two daily snapshots available in this range.", explain };
  }

  const transactions = await db.transaction.findMany({
    where: { portfolioId, occurredAt: { gte: series[0].date, lte: series[series.length - 1].date } },
  });
  const flowByDay = new Map<string, number>();
  for (const tx of transactions) {
    const fx = tx.fxRateToBase ? new Decimal(tx.fxRateToBase) : new Decimal(1);
    const gross = new Decimal(tx.grossAmount).abs().times(fx);
    const fee = new Decimal(tx.feeAmount).abs().times(fx);
    const day = tx.occurredAt.toISOString().slice(0, 10);
    if (tx.eventType === "buy" || tx.eventType === "transfer_in") {
      flowByDay.set(day, (flowByDay.get(day) ?? 0) + gross.plus(fee).toNumber());
    } else if (tx.eventType === "sell" || tx.eventType === "transfer_out") {
      flowByDay.set(day, (flowByDay.get(day) ?? 0) - gross.toNumber());
    }
  }

  const periods = [];
  for (let i = 1; i < series.length; i++) {
    const day = series[i].date.toISOString().slice(0, 10);
    periods.push({
      beginValue: series[i - 1].totalValue.toNumber(),
      endValue: series[i].totalValue.toNumber(),
      netExternalCashFlow: flowByDay.get(day) ?? 0,
    });
  }

  const result = twrr(periods);
  if (result.status === "unavailable") return { value: null, unavailableReason: result.reason, explain };
  return { value: result.rate, unavailableReason: null, explain };
}
