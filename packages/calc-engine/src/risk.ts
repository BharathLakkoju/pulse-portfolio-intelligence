/** Risk & diversification metrics — PRD "Risk and Diversification" table. */

/** Herfindahl-Hirschman Index over portfolio weights (0..1 each, should sum to ~1). Higher = more concentrated. */
export function herfindahlIndex(weights: number[]): number {
  return weights.reduce((sum, w) => sum + w * w, 0);
}

export interface ConcentrationResult {
  hhi: number; // 0..1
  hhiScaled: number; // 0..10000, conventional HHI scale
  topHoldingWeight: number;
  top5Weight: number;
  label: "low" | "moderate" | "high" | "very_high";
}

export function concentration(weightsDescending: number[]): ConcentrationResult {
  const sorted = [...weightsDescending].sort((a, b) => b - a);
  const hhi = herfindahlIndex(sorted);
  const hhiScaled = hhi * 10000;
  let label: ConcentrationResult["label"] = "low";
  if (hhiScaled >= 2500) label = "very_high";
  else if (hhiScaled >= 1800) label = "high";
  else if (hhiScaled >= 1000) label = "moderate";
  return {
    hhi,
    hhiScaled,
    topHoldingWeight: sorted[0] ?? 0,
    top5Weight: sorted.slice(0, 5).reduce((a, b) => a + b, 0),
    label,
  };
}

/** Simple diversification summary: effective number of holdings = 1 / HHI. */
export function effectiveNumberOfHoldings(weights: number[]): number {
  const hhi = herfindahlIndex(weights);
  return hhi > 0 ? 1 / hhi : 0;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdev(values: number[], sample = true): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - (sample ? 1 : 0));
  return Math.sqrt(variance);
}

export interface DrawdownResult {
  maxDrawdownPct: number; // positive number representing the largest decline, e.g. 0.23 = -23%
  peakIndex: number;
  troughIndex: number;
}

/** Maximum peak-to-trough decline over a value series. */
export function maxDrawdown(values: number[]): DrawdownResult {
  if (values.length === 0) return { maxDrawdownPct: 0, peakIndex: -1, troughIndex: -1 };
  let peak = values[0];
  let peakIndex = 0;
  let maxDd = 0;
  let ddPeakIndex = 0;
  let ddTroughIndex = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i];
      peakIndex = i;
    }
    const dd = peak > 0 ? (peak - values[i]) / peak : 0;
    if (dd > maxDd) {
      maxDd = dd;
      ddPeakIndex = peakIndex;
      ddTroughIndex = i;
    }
  }
  return { maxDrawdownPct: maxDd, peakIndex: ddPeakIndex, troughIndex: ddTroughIndex };
}

export interface RiskAdjustedResult {
  value: number | null;
  observations: number;
}

/** Sharpe = mean(Rp - Rf) / stdev(Rp - Rf) * sqrt(annualisation factor) (CLAUDE.md). */
export function sharpeRatio(periodReturns: number[], riskFreeRatePerPeriod: number, annualisationFactor: number): RiskAdjustedResult {
  if (periodReturns.length < 2) return { value: null, observations: periodReturns.length };
  const excess = periodReturns.map((r) => r - riskFreeRatePerPeriod);
  const sd = stdev(excess);
  if (sd === 0) return { value: null, observations: periodReturns.length };
  return { value: (mean(excess) / sd) * Math.sqrt(annualisationFactor), observations: periodReturns.length };
}

/** Sortino: like Sharpe but denominator is downside deviation only (returns below the target/riskfree rate). */
export function sortinoRatio(periodReturns: number[], riskFreeRatePerPeriod: number, annualisationFactor: number): RiskAdjustedResult {
  if (periodReturns.length < 2) return { value: null, observations: periodReturns.length };
  const excess = periodReturns.map((r) => r - riskFreeRatePerPeriod);
  const downside = excess.filter((e) => e < 0);
  if (downside.length === 0) return { value: null, observations: periodReturns.length };
  const downsideDev = Math.sqrt(downside.reduce((s, e) => s + e * e, 0) / downside.length);
  if (downsideDev === 0) return { value: null, observations: periodReturns.length };
  return { value: (mean(excess) / downsideDev) * Math.sqrt(annualisationFactor), observations: periodReturns.length };
}

export function covariance(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length < 2) return 0;
  const ma = mean(a);
  const mb = mean(b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - ma) * (b[i] - mb);
  return sum / (a.length - 1);
}

/** Beta of portfolio returns relative to a benchmark return series. */
export function beta(portfolioReturns: number[], benchmarkReturns: number[]): RiskAdjustedResult {
  if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) {
    return { value: null, observations: portfolioReturns.length };
  }
  const varBench = stdev(benchmarkReturns) ** 2;
  if (varBench === 0) return { value: null, observations: portfolioReturns.length };
  return { value: covariance(portfolioReturns, benchmarkReturns) / varBench, observations: portfolioReturns.length };
}

/** Pearson correlation coefficient between two return series. */
export function correlation(a: number[], b: number[]): RiskAdjustedResult {
  if (a.length !== b.length || a.length < 2) return { value: null, observations: a.length };
  const sdA = stdev(a);
  const sdB = stdev(b);
  if (sdA === 0 || sdB === 0) return { value: null, observations: a.length };
  return { value: covariance(a, b) / (sdA * sdB), observations: a.length };
}

/**
 * Historical VaR: the loss at percentile (1 - confidence) of observed returns.
 * Returned as a positive number representing the loss magnitude.
 * PRD: "estimates a historical distribution and is not a guaranteed loss limit."
 */
export function historicalVaR(periodReturns: number[], confidence = 0.95): RiskAdjustedResult {
  if (periodReturns.length < 5) return { value: null, observations: periodReturns.length };
  const sorted = [...periodReturns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  const clampedIndex = Math.max(0, Math.min(sorted.length - 1, index));
  const varReturn = sorted[clampedIndex];
  return { value: Math.max(0, -varReturn), observations: periodReturns.length };
}

export function volatility(periodReturns: number[], annualisationFactor: number): RiskAdjustedResult {
  if (periodReturns.length < 2) return { value: null, observations: periodReturns.length };
  return { value: stdev(periodReturns) * Math.sqrt(annualisationFactor), observations: periodReturns.length };
}
