import { describe, it, expect } from "vitest";
import { computePnl, simpleReturnPct } from "../src/pnl";
import { allocationDrift } from "../src/drift";

describe("computePnl", () => {
  it("matches the CLAUDE.md formula exactly", () => {
    const result = computePnl({
      currentValue: "150000",
      realizedProceeds: "20000",
      income: "5000",
      netContributions: "100000",
      fees: "500",
      taxes: "1500",
    });
    // 150000 + 20000 + 5000 - 100000 - 500 - 1500 = 73000
    expect(result.totalPnl).toBe("73000.00");
  });

  it("keeps decimal precision that floats would lose", () => {
    const result = computePnl({
      currentValue: "0.1",
      realizedProceeds: "0.2",
      income: "0",
      netContributions: "0",
      fees: "0",
      taxes: "0",
    });
    expect(result.totalPnl).toBe("0.30");
  });
});

describe("simpleReturnPct", () => {
  it("computes basic percentage return", () => {
    expect(simpleReturnPct("1000", "1250")).toBeCloseTo(25, 6);
  });

  it("returns null on zero invested base", () => {
    expect(simpleReturnPct("0", "100")).toBeNull();
  });
});

describe("allocationDrift", () => {
  it("flags a category that breaches the drift threshold", () => {
    const result = allocationDrift(
      [
        { category: "equity", actualWeight: 0.7, targetWeight: 0.6 },
        { category: "debt", actualWeight: 0.3, targetWeight: 0.4 },
      ],
      5,
    );
    expect(result[0].breachesThreshold).toBe(true);
    expect(result[0].drift).toBeCloseTo(0.1, 6);
  });
});
