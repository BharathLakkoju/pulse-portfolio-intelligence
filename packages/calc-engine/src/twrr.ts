export interface SubPeriod {
  /** Portfolio value at the start of the sub-period. */
  beginValue: number;
  /** Portfolio value at the end of the sub-period, before removing the period's net external cash flow. */
  endValue: number;
  /** Net external cash flow during the period (positive = contribution in, negative = withdrawal). */
  netExternalCashFlow: number;
}

export type TwrrResult =
  | { status: "ok"; rate: number; periodReturns: number[] }
  | { status: "unavailable"; reason: string };

/**
 * Time-weighted rate of return: chain-links sub-period holding returns,
 * removing the effect of the timing/size of external cash flows.
 * Requires periodic valuations bracketing every external cash flow
 * (CLAUDE.md: "TWRR where data coverage permits").
 */
export function twrr(periods: SubPeriod[]): TwrrResult {
  if (periods.length === 0) {
    return { status: "unavailable", reason: "No valuation periods supplied." };
  }

  const periodReturns: number[] = [];
  for (const p of periods) {
    if (p.beginValue <= 0) {
      return {
        status: "unavailable",
        reason: "A sub-period begins with a zero or negative portfolio value; TWRR is undefined for that period.",
      };
    }
    const hpr = (p.endValue - p.netExternalCashFlow) / p.beginValue - 1;
    if (!Number.isFinite(hpr)) {
      return { status: "unavailable", reason: "Non-finite holding period return encountered." };
    }
    periodReturns.push(hpr);
  }

  const linked = periodReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  if (!Number.isFinite(linked)) {
    return { status: "unavailable", reason: "Chain-linked return is non-finite." };
  }
  return { status: "ok", rate: linked, periodReturns };
}
