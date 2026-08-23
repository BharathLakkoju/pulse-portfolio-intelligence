import Decimal from "decimal.js";
import { db } from "./db";
import { computePositions, aggregateByInstrument } from "./portfolio";

export interface GoalProgress {
  goalId: string;
  name: string;
  type: string;
  targetAmount: Decimal;
  targetDate: Date;
  currentValue: Decimal;
  projectedLow: Decimal;
  projectedHigh: Decimal;
  progressPct: number;
  status: "ahead" | "on_track" | "behind";
  yearsRemaining: number;
}

/**
 * Goal projections are illustrative scenarios based on the user's own stated
 * expected-return range and contribution plan — never a promise or
 * guarantee, per PRD "Goals" section ("shown as scenarios, not promises").
 */
export async function computeGoalProgress(portfolioId: string): Promise<GoalProgress[]> {
  const goals = await db.goal.findMany({ where: { portfolioId } });
  if (goals.length === 0) return [];

  const positions = await computePositions(portfolioId);
  const held = aggregateByInstrument(positions);

  const results: GoalProgress[] = [];
  for (const g of goals) {
    const linkedIds = g.linkedAccountIds ? g.linkedAccountIds.split(",").filter(Boolean) : [];
    const currentValue =
      linkedIds.length > 0
        ? positions.filter((p) => linkedIds.includes(p.accountId)).reduce((s, p) => s.plus(p.currentValue), new Decimal(0))
        : held.reduce((s, p) => s.plus(p.currentValue), new Decimal(0));

    const now = new Date();
    const years = Math.max((g.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365), 0);
    const annualContribution =
      new Decimal(g.contributionAmount).times(g.contributionFrequency === "monthly" ? 12 : g.contributionFrequency === "quarterly" ? 4 : 1);

    const projectedLow = futureValue(currentValue, annualContribution, g.expectedReturnLow, years);
    const projectedHigh = futureValue(currentValue, annualContribution, g.expectedReturnHigh, years);
    const mid = projectedLow.plus(projectedHigh).dividedBy(2);
    const target = new Decimal(g.targetAmount);
    const progressPct = target.gt(0) ? mid.dividedBy(target).times(100).toNumber() : 0;
    const status: GoalProgress["status"] = progressPct >= 110 ? "ahead" : progressPct >= 90 ? "on_track" : "behind";

    results.push({
      goalId: g.id,
      name: g.name,
      type: g.type,
      targetAmount: target,
      targetDate: g.targetDate,
      currentValue,
      projectedLow,
      projectedHigh,
      progressPct,
      status,
      yearsRemaining: years,
    });
  }
  return results;
}

function futureValue(present: Decimal, annualContribution: Decimal, annualReturn: number, years: number): Decimal {
  const r = annualReturn;
  const growthOfPresent = present.times(Math.pow(1 + r, years));
  const growthOfContributions =
    r === 0 ? annualContribution.times(years) : annualContribution.times((Math.pow(1 + r, years) - 1) / r);
  return growthOfPresent.plus(growthOfContributions);
}
