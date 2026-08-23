import { describe, it, expect } from "vitest";
import { twrr } from "../src/twrr";

describe("twrr", () => {
  it("removes the distorting effect of a large mid-period contribution", () => {
    // Period 1: 100 -> 110 (10% organic gain), no cash flow.
    // Period 2: 110 grows 5% organically to 115.5, then a 100 contribution
    // lands, so endValue (post-contribution) = 215.5.
    const result = twrr([
      { beginValue: 100, endValue: 110, netExternalCashFlow: 0 },
      { beginValue: 110, endValue: 215.5, netExternalCashFlow: 100 },
    ]);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      // (1.10 * 1.05) - 1 = 0.155
      expect(result.rate).toBeCloseTo(0.155, 4);
    }
  });

  it("returns unavailable when a period begins at zero value", () => {
    const result = twrr([{ beginValue: 0, endValue: 100, netExternalCashFlow: 100 }]);
    expect(result.status).toBe("unavailable");
  });

  it("returns 0 for a flat single period with no flows", () => {
    const result = twrr([{ beginValue: 100, endValue: 100, netExternalCashFlow: 0 }]);
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.rate).toBeCloseTo(0, 6);
  });
});
