import { describe, it, expect } from "vitest";
import {
  herfindahlIndex,
  concentration,
  maxDrawdown,
  sharpeRatio,
  historicalVaR,
  correlation,
  beta,
  effectiveNumberOfHoldings,
} from "../src/risk";

describe("herfindahlIndex / concentration", () => {
  it("scores an equal-weighted 4-holding portfolio at 0.25 HHI", () => {
    expect(herfindahlIndex([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(0.25, 6);
  });

  it("scores a single-holding portfolio as maximally concentrated", () => {
    const c = concentration([1]);
    expect(c.hhi).toBeCloseTo(1, 6);
    expect(c.label).toBe("very_high");
  });

  it("effective number of holdings for equal weights equals holding count", () => {
    expect(effectiveNumberOfHoldings([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(4, 6);
  });
});

describe("maxDrawdown", () => {
  it("finds the largest peak-to-trough decline", () => {
    const result = maxDrawdown([100, 120, 90, 95, 130, 70]);
    // Peak 130 -> trough 70 = 46.15% drawdown, larger than 120->90 (25%)
    expect(result.maxDrawdownPct).toBeCloseTo(0.4615, 3);
  });

  it("returns 0 drawdown for a monotonically increasing series", () => {
    const result = maxDrawdown([100, 110, 120, 130]);
    expect(result.maxDrawdownPct).toBe(0);
  });
});

describe("sharpeRatio", () => {
  it("returns null with fewer than 2 observations", () => {
    expect(sharpeRatio([0.01], 0, 12).value).toBeNull();
  });

  it("computes a positive Sharpe for consistently positive excess returns with variance", () => {
    const result = sharpeRatio([0.02, 0.01, 0.03, 0.015], 0.001, 12);
    expect(result.value).not.toBeNull();
    expect(result.value as number).toBeGreaterThan(0);
  });
});

describe("historicalVaR", () => {
  it("returns null with too few observations", () => {
    expect(historicalVaR([0.01, -0.02], 0.95).value).toBeNull();
  });

  it("finds the 5th percentile loss for a 100-point uniform loss series", () => {
    const returns = Array.from({ length: 100 }, (_, i) => -0.01 * i); // 0 to -0.99
    const result = historicalVaR(returns, 0.95);
    expect(result.value).not.toBeNull();
    expect(result.value as number).toBeGreaterThan(0);
  });
});

describe("correlation / beta", () => {
  it("finds perfect positive correlation for identical series", () => {
    const a = [0.01, 0.02, -0.01, 0.03];
    const result = correlation(a, a);
    expect(result.value).toBeCloseTo(1, 6);
  });

  it("finds beta of 1 when portfolio tracks benchmark exactly", () => {
    const bench = [0.01, 0.02, -0.01, 0.03];
    const result = beta(bench, bench);
    expect(result.value).toBeCloseTo(1, 6);
  });
});
