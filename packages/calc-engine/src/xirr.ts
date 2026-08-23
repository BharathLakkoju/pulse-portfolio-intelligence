export interface CashFlow {
  date: Date;
  amount: number; // negative = outflow (invested), positive = inflow (received/value)
}

export type XirrResult =
  | { status: "ok"; rate: number; iterations: number }
  | { status: "unavailable"; reason: string };

const DAYS_PER_YEAR = 365;
const MAX_NEWTON_ITERATIONS = 100;
const NEWTON_TOLERANCE = 1e-7;
const MAX_BISECTION_ITERATIONS = 200;
const BISECTION_TOLERANCE = 1e-7;

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function npv(rate: number, flows: CashFlow[], d0: Date): number {
  return flows.reduce((sum, cf) => {
    const t = daysBetween(d0, cf.date) / DAYS_PER_YEAR;
    return sum + cf.amount / Math.pow(1 + rate, t);
  }, 0);
}

function dNpv(rate: number, flows: CashFlow[], d0: Date): number {
  return flows.reduce((sum, cf) => {
    const t = daysBetween(d0, cf.date) / DAYS_PER_YEAR;
    if (t === 0) return sum;
    return sum - (t * cf.amount) / Math.pow(1 + rate, t + 1);
  }, 0);
}

/**
 * Solve for the money-weighted rate of return (XIRR) given signed cash flows.
 * Per CLAUDE.md: surface an explicit "unavailable" state rather than
 * guessing when the cash-flow pattern can't converge.
 */
export function xirr(flows: CashFlow[], guess = 0.1): XirrResult {
  const nonZero = flows.filter((f) => f.amount !== 0);
  if (nonZero.length < 2) {
    return { status: "unavailable", reason: "Need at least two non-zero cash flows." };
  }

  const hasPositive = nonZero.some((f) => f.amount > 0);
  const hasNegative = nonZero.some((f) => f.amount < 0);
  if (!hasPositive || !hasNegative) {
    return {
      status: "unavailable",
      reason: "Cash flows must include at least one inflow and one outflow to compute a return.",
    };
  }

  const sorted = [...nonZero].sort((a, b) => a.date.getTime() - b.date.getTime());
  const d0 = sorted[0].date;

  // Newton-Raphson first.
  let rate = guess;
  for (let i = 0; i < MAX_NEWTON_ITERATIONS; i++) {
    const f = npv(rate, sorted, d0);
    const df = dNpv(rate, sorted, d0);
    if (df === 0 || !Number.isFinite(df)) break;
    const next = rate - f / df;
    if (!Number.isFinite(next) || next <= -1) break;
    if (Math.abs(next - rate) < NEWTON_TOLERANCE) {
      return { status: "ok", rate: next, iterations: i + 1 };
    }
    rate = next;
  }
  if (Number.isFinite(rate) && rate > -1 && Math.abs(npv(rate, sorted, d0)) < 1e-3) {
    return { status: "ok", rate, iterations: MAX_NEWTON_ITERATIONS };
  }

  // Bisection fallback over a wide, bounded rate range where NPV changes sign.
  let lo = -0.9999;
  let hi = 10; // 1000% annualised — generous upper bound
  const fLo = npv(lo, sorted, d0);
  const fHi = npv(hi, sorted, d0);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) {
    return {
      status: "unavailable",
      reason: "Cash-flow pattern does not converge to a single real rate of return in the searched range.",
    };
  }

  for (let i = 0; i < MAX_BISECTION_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, sorted, d0);
    if (Math.abs(fMid) < BISECTION_TOLERANCE || hi - lo < BISECTION_TOLERANCE) {
      return { status: "ok", rate: mid, iterations: i + 1 };
    }
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return { status: "unavailable", reason: "Bisection did not converge within iteration limit." };
}
