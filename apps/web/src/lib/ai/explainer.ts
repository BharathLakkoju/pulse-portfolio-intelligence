import Decimal from "decimal.js";
import { db } from "../db";
import { computePositions, aggregateByInstrument } from "../portfolio";
import { computeSectorConcentration } from "../risk";
import { indiaFinancialYear } from "../dates";
import { isDisallowedFinancialAdviceQuestion, GENERIC_DISCLAIMER } from "../compliance";

/**
 * Rule-based, fully-grounded portfolio explainer — see QUESTIONS.md #10 for
 * why this isn't a general LLM. Every answer is generated from a real query
 * against the user's own data and cites its data timestamp/scope, per PRD
 * "AI Portfolio Explainer" guardrails.
 */

const TERM_DEFINITIONS: Record<string, string> = {
  xirr: "XIRR (extended internal rate of return) is the annualised, money-weighted return that makes the present value of all your actual cash flows (money in, money out, plus current value) equal zero. It accounts for the timing and size of every contribution and withdrawal.",
  twrr: "TWRR (time-weighted rate of return) chain-links returns across sub-periods bounded by cash flows, removing the effect of when you added or withdrew money — it measures how well the underlying investments performed, independent of your contribution timing.",
  cagr: "CAGR (compound annual growth rate) is the smoothed annual growth rate that would take a starting value to an ending value over a given number of years, assuming steady compounding.",
  drawdown: "Drawdown is the percentage decline from a portfolio's highest historical value (peak) to a subsequent low (trough), before it recovers. Maximum drawdown is the largest such decline over the period shown.",
  beta: "Beta measures how sensitive your portfolio's returns are to movements in a benchmark. A beta of 1 means your portfolio has historically moved in line with the benchmark; above 1 means more sensitive, below 1 means less.",
  "allocation drift": "Allocation drift is the difference between your current (actual) weight in a category and the target weight you set for it — Actual Weight minus Target Weight.",
  "tax lot": "A tax lot is a specific batch of a holding acquired at a particular time and price. When you sell, Pulse matches the sale against lots using FIFO (first bought, first sold) by default, to compute your holding period and realized gain.",
  sharpe: "The Sharpe ratio measures return earned per unit of risk taken: the average return above a risk-free rate, divided by the volatility (standard deviation) of those excess returns.",
  hhi: "The Herfindahl-Hirschman Index (HHI) measures concentration: it's the sum of each holding's squared portfolio weight. Higher HHI means your value is concentrated in fewer positions.",
};

export interface ExplainerAnswer {
  intent: string;
  answer: string;
  grounding: Record<string, unknown>;
  disclaimer: string;
}

export async function answerPortfolioQuestion(userId: string, portfolioId: string, question: string): Promise<ExplainerAnswer> {
  const q = question.toLowerCase().trim();

  if (isDisallowedFinancialAdviceQuestion(q)) {
    return {
      intent: "disallowed",
      answer:
        "I can't tell you what to buy, sell, or hold, or predict where a price is headed — Pulse is a tracking and analytics tool, not a registered investment adviser. I can show you what you already own, how it's performed, and where your risk is concentrated, and you can take that to your own decision or a licensed adviser.",
      grounding: {},
      disclaimer: GENERIC_DISCLAIMER,
    };
  }

  for (const [term, definition] of Object.entries(TERM_DEFINITIONS)) {
    if (q.includes(term)) {
      return { intent: "explain_term", answer: definition, grounding: { term }, disclaimer: GENERIC_DISCLAIMER };
    }
  }

  if (q.includes("today") && (q.includes("change") || q.includes("move"))) {
    return answerTodayChange(portfolioId);
  }

  if (q.includes("sector") && (q.includes("exceed") || q.includes("concentrat") || q.includes("20%") || q.includes("%"))) {
    return answerSectorConcentration(portfolioId);
  }

  if (q.includes("dividend")) {
    return answerDividendsThisFY(portfolioId);
  }

  if (q.includes("since last month") || q.includes("what changed") || q.includes("what's changed")) {
    return answerWhatChanged(portfolioId);
  }

  if (q.includes("missing") || q.includes("stale")) {
    return answerMissingStaleData(portfolioId);
  }

  return {
    intent: "unrecognised",
    answer:
      "I can currently answer: why your portfolio changed today, which sectors exceed a concentration threshold, what dividends you received this financial year, what changed since last month, definitions of terms like XIRR/drawdown/beta/allocation drift/tax lot, and a summary of missing or stale data. Try rephrasing your question along those lines.",
    grounding: {},
    disclaimer: GENERIC_DISCLAIMER,
  };
}

async function answerTodayChange(portfolioId: string): Promise<ExplainerAnswer> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const [todayPositions, yesterdayPositions] = await Promise.all([
    computePositions(portfolioId, { asOfDate: now }),
    computePositions(portfolioId, { asOfDate: yesterday }),
  ]);
  const today = aggregateByInstrument(todayPositions);
  const prior = aggregateByInstrument(yesterdayPositions);
  const priorByInstrument = new Map(prior.map((p) => [p.instrumentId, p]));

  const movers = today
    .map((p) => {
      const before = priorByInstrument.get(p.instrumentId);
      const beforeValue = before?.currentValue ?? new Decimal(0);
      const change = p.currentValue.minus(beforeValue);
      return { symbol: p.symbol, change };
    })
    .filter((m) => !m.change.isZero())
    .sort((a, b) => b.change.abs().comparedTo(a.change.abs()));

  const totalChange = movers.reduce((s, m) => s.plus(m.change), new Decimal(0));
  const top = movers.slice(0, 3);

  const answer =
    movers.length === 0
      ? "Your portfolio value looks unchanged versus the last available valuation — no new trades or price moves recorded."
      : `Your portfolio value moved ${totalChange.gte(0) ? "up" : "down"} by ${totalChange.abs().toFixed(2)} versus the prior valuation. Biggest contributors: ${top
          .map((m) => `${m.symbol} (${m.change.gte(0) ? "+" : ""}${m.change.toFixed(2)})`)
          .join(", ")}.`;

  return {
    intent: "today_change",
    answer,
    grounding: { asOf: now.toISOString(), comparedTo: yesterday.toISOString(), movers: top },
    disclaimer: GENERIC_DISCLAIMER,
  };
}

async function answerSectorConcentration(portfolioId: string): Promise<ExplainerAnswer> {
  const sectors = await computeSectorConcentration(portfolioId);
  const over20 = sectors.filter((s) => s.weight > 0.2);
  const answer =
    over20.length === 0
      ? `No sector currently exceeds 20% of this portfolio. Largest sector: ${sectors[0] ? `${sectors[0].sector} at ${(sectors[0].weight * 100).toFixed(1)}%` : "n/a"}.`
      : `${over20.map((s) => `${s.sector} at ${(s.weight * 100).toFixed(1)}%`).join(", ")} ${over20.length > 1 ? "exceed" : "exceeds"} 20% of this portfolio.`;

  return { intent: "sector_concentration", answer, grounding: { sectors, asOf: new Date().toISOString() }, disclaimer: GENERIC_DISCLAIMER };
}

async function answerDividendsThisFY(portfolioId: string): Promise<ExplainerAnswer> {
  const fy = indiaFinancialYear(new Date());
  const dividends = await db.transaction.findMany({
    where: { portfolioId, eventType: "dividend" },
    include: { instrument: true },
    orderBy: { occurredAt: "desc" },
  });
  const thisFy = dividends.filter((d) => indiaFinancialYear(d.occurredAt) === fy);
  const total = thisFy.reduce((s, d) => s.plus(new Decimal(d.grossAmount)), new Decimal(0));

  const answer =
    thisFy.length === 0
      ? `No dividend transactions recorded yet for ${fy}.`
      : `You received ${total.toFixed(2)} in dividends during ${fy}, across ${thisFy.length} payment(s): ${thisFy
          .slice(0, 5)
          .map((d) => `${d.instrument?.symbol ?? "?"} (${new Decimal(d.grossAmount).toFixed(2)})`)
          .join(", ")}${thisFy.length > 5 ? "…" : ""}.`;

  return { intent: "dividends_this_fy", answer, grounding: { financialYear: fy, count: thisFy.length, total: total.toFixed(2) }, disclaimer: GENERIC_DISCLAIMER };
}

async function answerWhatChanged(portfolioId: string): Promise<ExplainerAnswer> {
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setUTCMonth(monthAgo.getUTCMonth() - 1);

  const recentTx = await db.transaction.findMany({
    where: { portfolioId, occurredAt: { gte: monthAgo } },
    include: { instrument: true },
    orderBy: { occurredAt: "desc" },
    take: 10,
  });

  const answer =
    recentTx.length === 0
      ? "No new transactions recorded in the last month."
      : `${recentTx.length} transaction(s) in the last month, most recently: ${recentTx
          .slice(0, 5)
          .map((t) => `${t.eventType} ${t.instrument?.symbol ?? ""}`.trim())
          .join(", ")}.`;

  return { intent: "what_changed", answer, grounding: { since: monthAgo.toISOString(), count: recentTx.length }, disclaimer: GENERIC_DISCLAIMER };
}

async function answerMissingStaleData(portfolioId: string): Promise<ExplainerAnswer> {
  const positions = aggregateByInstrument(await computePositions(portfolioId));
  const stale = positions.filter((p) => p.priceLabel === "stale" || p.priceLabel === "unavailable");
  const missingCost = positions.filter((p) => p.avgCostPerUnit.lte(0) && p.quantity.gt(0));
  const needsReview = await db.transaction.count({ where: { portfolioId, reconciliationState: "needs_review" } });

  const parts: string[] = [];
  if (stale.length) parts.push(`${stale.length} holding(s) with stale/unavailable pricing (${stale.map((s) => s.symbol).join(", ")})`);
  if (missingCost.length) parts.push(`${missingCost.length} holding(s) missing a cost basis`);
  if (needsReview) parts.push(`${needsReview} transaction(s) queued for reconciliation review`);

  return {
    intent: "missing_stale_data",
    answer: parts.length === 0 ? "No missing or stale data flags right now — everything looks current." : parts.join("; ") + ".",
    grounding: { staleCount: stale.length, missingCostCount: missingCost.length, needsReview },
    disclaimer: GENERIC_DISCLAIMER,
  };
}
