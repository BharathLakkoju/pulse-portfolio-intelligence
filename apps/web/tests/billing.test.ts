import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../src/lib/db";
import { localBillingProvider } from "../src/lib/billing/local";

/**
 * Instructions.md §4: "Webhook handlers (Razorpay): signature-verification
 * tests and duplicate-delivery idempotency tests are mandatory before
 * merge." The local billing provider stands in for the real Razorpay
 * webhook handler (see QUESTIONS.md #6) but must honor the same
 * idempotency contract: replaying a confirmation for the same order must
 * not create a second invoice or double-charge the entitlement write.
 */
describe("billing confirmPayment idempotency", () => {
  let userId: string;

  beforeAll(async () => {
    const user = await db.user.create({ data: { email: `billing-test-${Date.now()}@pulse.test`, onboardingComplete: true } });
    userId = user.id;
    await db.subscription.create({ data: { userId, planId: "free" } });
  });

  afterAll(async () => {
    await db.invoice.deleteMany({ where: { userId } });
    await db.subscription.deleteMany({ where: { userId } });
    await db.user.delete({ where: { id: userId } });
  });

  it("creates exactly one invoice and active subscription on first confirmation", async () => {
    await localBillingProvider.confirmPayment(userId, "order_dup_test_1", "pro_india", "monthly");
    const invoices = await db.invoice.findMany({ where: { userId, razorpayOrderId: "order_dup_test_1" } });
    expect(invoices).toHaveLength(1);

    const sub = await db.subscription.findUnique({ where: { userId } });
    expect(sub?.planId).toBe("pro_india");
    expect(sub?.status).toBe("active");
  });

  it("does not create a duplicate invoice when the same order is confirmed twice (simulated duplicate webhook delivery)", async () => {
    const before = await db.invoice.count({ where: { userId, razorpayOrderId: "order_dup_test_1" } });
    await localBillingProvider.confirmPayment(userId, "order_dup_test_1", "pro_india", "monthly");
    const after = await db.invoice.count({ where: { userId, razorpayOrderId: "order_dup_test_1" } });
    expect(after).toBe(before);
    expect(after).toBe(1);
  });
});
