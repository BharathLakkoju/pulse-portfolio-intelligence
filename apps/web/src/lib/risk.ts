import Decimal from "decimal.js";
import {
  concentration,
  effectiveNumberOfHoldings,
  maxDrawdown,
  sharpeRatio,
  sortinoRatio,
  beta as betaCalc,
  correlation as correlationCalc,
  historicalVaR,
  volatility,
} from "@pulse/calc-engine";
import { db } from "./db";
import { getSnapshotSeries } from "./snapshots";
import { aggregateByInstrument, computePositions } from "./portfolio";
import { allocationDrift, type DriftResult } from "@pulse/calc-engine";

const TRADING_DAYS_PER_YEAR = 252;
const DEFAULT_RISK_FREE_ANNUAL = 0.065; // India ~ short-term G-sec proxy; configurable, not investment advice

function dailyReturns(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) out.push(values[i] / values[i - 1] - 1);
  }
  return out;
}

export async function computeConcentration(portfolioId: string) {
  const positions = await computePositions(portfolioId);
  const held = aggregateByInstrument(positions);
  const totalValue = held.reduce((s, p) => s.plus(p.currentValue), new Decimal(0));
  const weights = held
    .map((p) => (totalValue.gt(0) ? p.currentValue.dividedBy(totalValue).toNumber() : 0))
    .sort((a, b) => b - a);

  const result = concentration(weights);
  const topHoldings = held
    .map((p) => ({
      symbol: p.symbol,
      name: p.name,
      weight: totalValue.gt(0) ? p.currentValue.dividedBy(totalValue).toNumber() : 0,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);

  return {
    ...result,
    effectiveHoldings: effectiveNumberOfHoldings(weights),
    holdingCount: held.length,
    topHoldings,
  };
}

export async function computeSectorConcentration(portfolioId: string) {
  const positions = await computePositions(portfolioId);
  const held = aggregateByInstrument(positions);
  const totalValue = held.reduce((s, p) => s.plus(p.currentValue), new Decimal(0));
  const bySector = new Map<string, Decimal>();
  for (const p of held) {
    const sector = p.sector ?? "Unclassified";
    bySector.set(sector, (bySector.get(sector) ?? new Decimal(0)).plus(p.currentValue));
  }
  return [...bySector.entries()]
    .map(([sector, value]) => ({ sector, weight: totalValue.gt(0) ? value.dividedBy(totalValue).toNumber() : 0 }))
    .sort((a, b) => b.weight - a.weight);
}

export async function computeDriftReport(portfolioId: string): Promise<DriftResult[]> {
  const targets = await db.targetAllocation.findMany({ where: { portfolioId } });
  if (targets.length === 0) return [];
  const positions = await computePositions(portfolioId);
  const held = aggregateByInstrument(positions);
  const totalValue = held.reduce((s, p) => s.plus(p.currentValue), new Decimal(0));
  const byCategory = new Map<string, Decimal>();
  for (const p of held) {
    byCategory.set(p.assetClass, (byCategory.get(p.assetClass) ?? new Decimal(0)).plus(p.currentValue));
  }
  const inputs = targets.map((t) => ({
    category: t.category,
    actualWeight: totalValue.gt(0) ? (byCategory.get(t.category) ?? new Decimal(0)).dividedBy(totalValue).toNumber() : 0,
    targetWeight: t.targetWeight,
  }));
  return allocationDrift(inputs, 5);
}

export interface RiskDashboard {
  observations: number;
  volatilityAnnualised: number | null;
  maxDrawdownPct: number | null;
  sharpe: number | null;
  sortino: number | null;
  beta: number | null;
  correlationToBenchmark: number | null;
  historicalVaR95: number | null;
  benchmarkId: string;
  riskFreeRateAssumption: number;
  annualisationMethod: string;
  dataQualityWarnings: string[];
}

export async function computeRiskDashboard(portfolioId: string, startDate: Date, endDate: Date, benchmarkId: string): Promise<RiskDashboard> {
  const series = await getSnapshotSeries(portfolioId, startDate, endDate);
  const warnings: string[] = [];
  if (series.length < 10) warnings.push("Fewer than 10 daily observations — risk metrics may be unstable.");

  const values = series.map((s) => s.totalValue.toNumber());
  const returns = dailyReturns(values);
  const dd = maxDrawdown(values);

  const benchRows = await db.benchmarkPrice.findMany({
    where: { benchmarkId, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "asc" },
  });
  const benchValues = benchRows.map((r) => new Decimal(r.close).toNumber());
  const benchReturns = dailyReturns(benchValues);

  const alignedLength = Math.min(returns.length, benchReturns.length);
  const alignedPortfolio = returns.slice(-alignedLength);
  const alignedBench = benchReturns.slice(-alignedLength);

  const riskFreeDaily = DEFAULT_RISK_FREE_ANNUAL / TRADING_DAYS_PER_YEAR;
  const sharpe = sharpeRatio(returns, riskFreeDaily, TRADING_DAYS_PER_YEAR);
  const sortino = sortinoRatio(returns, riskFreeDaily, TRADING_DAYS_PER_YEAR);
  const vol = volatility(returns, TRADING_DAYS_PER_YEAR);
  const varResult = historicalVaR(returns, 0.95);
  const betaResult = alignedLength >= 2 ? betaCalc(alignedPortfolio, alignedBench) : { value: null, observations: 0 };
  const corrResult = alignedLength >= 2 ? correlationCalc(alignedPortfolio, alignedBench) : { value: null, observations: 0 };

  if (benchValues.length < 2) warnings.push(`No benchmark price history loaded for ${benchmarkId} in this range.`);

  return {
    observations: returns.length,
    volatilityAnnualised: vol.value,
    maxDrawdownPct: series.length > 0 ? dd.maxDrawdownPct : null,
    sharpe: sharpe.value,
    sortino: sortino.value,
    beta: betaResult.value,
    correlationToBenchmark: corrResult.value,
    historicalVaR95: varResult.value,
    benchmarkId,
    riskFreeRateAssumption: DEFAULT_RISK_FREE_ANNUAL,
    annualisationMethod: `Daily returns x sqrt(${TRADING_DAYS_PER_YEAR}) trading days/year`,
    dataQualityWarnings: warnings,
  };
}
