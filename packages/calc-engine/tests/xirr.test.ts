import { describe, it, expect } from "vitest";
import { xirr } from "../src/xirr";

describe("xirr", () => {
  it("matches the canonical Excel XIRR worked example (~37.34%)", () => {
    const flows = [
      { date: new Date("2008-01-01"), amount: -10000 },
      { date: new Date("2008-03-01"), amount: 2750 },
      { date: new Date("2008-10-30"), amount: 4250 },
      { date: new Date("2009-02-15"), amount: 3250 },
      { date: new Date("2009-04-01"), amount: 2750 },
    ];
    const result = xirr(flows);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.rate).toBeCloseTo(0.373362535, 4);
    }
  });

  it("computes ~10% for a simple one-year round trip", () => {
    const flows = [
      { date: new Date("2023-01-01"), amount: -1000 },
      { date: new Date("2024-01-01"), amount: 1100 },
    ];
    const result = xirr(flows);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.rate).toBeCloseTo(0.1, 2);
    }
  });

  it("returns unavailable for a single cash flow", () => {
    const result = xirr([{ date: new Date("2023-01-01"), amount: -1000 }]);
    expect(result.status).toBe("unavailable");
  });

  it("returns unavailable when all cash flows are the same sign", () => {
    const result = xirr([
      { date: new Date("2023-01-01"), amount: -1000 },
      { date: new Date("2023-06-01"), amount: -500 },
    ]);
    expect(result.status).toBe("unavailable");
  });

  it("returns unavailable for an all-zero cash-flow set", () => {
    const result = xirr([
      { date: new Date("2023-01-01"), amount: 0 },
      { date: new Date("2023-06-01"), amount: 0 },
    ]);
    expect(result.status).toBe("unavailable");
  });

  it("handles a break-even round trip (~0%)", () => {
    const flows = [
      { date: new Date("2023-01-01"), amount: -1000 },
      { date: new Date("2023-12-31"), amount: 1000 },
    ];
    const result = xirr(flows);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.rate).toBeCloseTo(0, 2);
    }
  });

  it("handles a large loss (negative rate)", () => {
    const flows = [
      { date: new Date("2023-01-01"), amount: -1000 },
      { date: new Date("2024-01-01"), amount: 400 },
    ];
    const result = xirr(flows);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.rate).toBeLessThan(0);
      expect(result.rate).toBeCloseTo(-0.6, 1);
    }
  });
});
