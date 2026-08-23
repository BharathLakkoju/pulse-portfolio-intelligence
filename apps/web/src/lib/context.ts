import { db } from "./db";
import type { AuthedUser } from "./session";

export async function resolveActivePortfolio(user: AuthedUser, requestedId?: string) {
  const portfolios = await db.portfolio.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const active = (requestedId && portfolios.find((p) => p.id === requestedId)) || portfolios[0] || null;
  return { portfolios, active };
}
