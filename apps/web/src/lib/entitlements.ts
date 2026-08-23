import { PLANS, type PlanId } from "@pulse/shared-types";
import { db } from "./db";

/**
 * Server-side entitlement check — never trust client state for gating.
 * Instructions.md §6: "Entitlements enforced server-side, never trusted
 * from client state."
 */
export async function getEntitlements(userId: string) {
  const sub = await db.subscription.findUnique({ where: { userId } });
  const planId = (sub?.status === "active" || sub?.status === "trialing" ? sub.planId : "free") as PlanId;
  const plan = PLANS[planId] ?? PLANS.free;
  return { plan, subscription: sub };
}

export async function requireEntitlement(userId: string, check: (plan: (typeof PLANS)[PlanId]) => boolean) {
  const { plan } = await getEntitlements(userId);
  if (!check(plan)) {
    throw new Error(`FEATURE_GATED:${plan.id}`);
  }
  return plan;
}
