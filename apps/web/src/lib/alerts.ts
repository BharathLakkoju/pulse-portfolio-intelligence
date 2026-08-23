import { db } from "./db";
import { computePositions, aggregateByInstrument } from "./portfolio";
import { computeConcentration, computeDriftReport } from "./risk";

interface CandidateAlert {
  portfolioId: string | null;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  evidence: Record<string, unknown>;
}

/**
 * Evaluates alert rules for a user across their portfolios and writes new
 * Alert rows. Idempotent per day: won't duplicate an identical open alert
 * created within the last 20 hours. Stands in for the queue-driven
 * "Notifications" worker (see QUESTIONS.md #1) — invoked on-demand here.
 */
export async function evaluateAlertsForUser(userId: string) {
  const portfolios = await db.portfolio.findMany({ where: { userId } });
  const candidates: CandidateAlert[] = [];

  for (const portfolio of portfolios) {
    const drift = await computeDriftReport(portfolio.id);
    for (const d of drift) {
      if (d.breachesThreshold) {
        candidates.push({
          portfolioId: portfolio.id,
          type: "drift",
          severity: d.absDrift > 0.1 ? "warning" : "info",
          title: `${d.category} allocation has drifted ${(d.drift * 100).toFixed(1)}pp from target`,
          message: `Actual weight ${(d.actualWeight * 100).toFixed(1)}% vs target ${(d.targetWeight * 100).toFixed(1)}%.`,
          evidence: { category: d.category, drift: d.drift, actualWeight: d.actualWeight, targetWeight: d.targetWeight },
        });
      }
    }

    const concentration = await computeConcentration(portfolio.id);
    if (concentration.label === "high" || concentration.label === "very_high") {
      const top = concentration.topHoldings[0];
      candidates.push({
        portfolioId: portfolio.id,
        type: "concentration",
        severity: concentration.label === "very_high" ? "warning" : "info",
        title: `Portfolio concentration is ${concentration.label.replace("_", " ")}`,
        message: top ? `${top.symbol} is ${(top.weight * 100).toFixed(1)}% of this portfolio.` : "Concentration threshold crossed.",
        evidence: { hhiScaled: concentration.hhiScaled, topHoldings: concentration.topHoldings },
      });
    }

    const positions = await computePositions(portfolio.id);
    const held = aggregateByInstrument(positions);
    const stale = held.filter((p) => p.priceLabel === "stale" || p.priceLabel === "unavailable");
    if (stale.length > 0) {
      candidates.push({
        portfolioId: portfolio.id,
        type: "stale_sync",
        severity: "warning",
        title: `${stale.length} holding(s) have stale or unavailable pricing`,
        message: stale.map((s) => s.symbol).join(", "),
        evidence: { symbols: stale.map((s) => s.symbol) },
      });
    }

    const missingCost = held.filter((p) => p.avgCostPerUnit.lte(0) && p.quantity.gt(0));
    if (missingCost.length > 0) {
      candidates.push({
        portfolioId: portfolio.id,
        type: "missing_cost_basis",
        severity: "warning",
        title: `${missingCost.length} holding(s) are missing a cost basis`,
        message: missingCost.map((s) => s.symbol).join(", "),
        evidence: { symbols: missingCost.map((s) => s.symbol) },
      });
    }
  }

  const failedAccounts = await db.account.findMany({
    where: { portfolio: { userId }, status: { in: ["failed", "reconnect_required"] } },
  });
  for (const acc of failedAccounts) {
    candidates.push({
      portfolioId: null,
      type: "connection_expiry",
      severity: "critical",
      title: `${acc.name} needs reconnection`,
      message: `Connection status: ${acc.status.replace("_", " ")}.`,
      evidence: { accountId: acc.id, status: acc.status },
    });
  }

  let created = 0;
  const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);
  for (const c of candidates) {
    const recent = await db.alert.findFirst({
      where: { userId, type: c.type, portfolioId: c.portfolioId ?? undefined, createdAt: { gte: cutoff } },
    });
    if (recent) continue;
    await db.alert.create({
      data: {
        userId,
        portfolioId: c.portfolioId,
        type: c.type,
        severity: c.severity,
        title: c.title,
        message: c.message,
        evidenceJson: JSON.stringify(c.evidence),
      },
    });
    created++;
  }
  return { evaluated: candidates.length, created };
}
