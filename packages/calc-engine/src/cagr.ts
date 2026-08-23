export type CagrResult =
  | { status: "ok"; rate: number; years: number }
  | { status: "unavailable"; reason: string };

/**
 * Compound annual growth rate between two point-in-time values.
 * Only meaningful for periods >= ~1 period and positive begin value.
 */
export function cagr(beginValue: number, endValue: number, years: number): CagrResult {
  if (years <= 0) {
    return { status: "unavailable", reason: "Time span must be positive to annualise a growth rate." };
  }
  if (beginValue <= 0) {
    return { status: "unavailable", reason: "Beginning value must be positive to compute CAGR." };
  }
  if (endValue < 0) {
    return { status: "unavailable", reason: "Ending value cannot be negative." };
  }
  const rate = Math.pow(endValue / beginValue, 1 / years) - 1;
  if (!Number.isFinite(rate)) {
    return { status: "unavailable", reason: "CAGR computation produced a non-finite result." };
  }
  return { status: "ok", rate, years };
}
