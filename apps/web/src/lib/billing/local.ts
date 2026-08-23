import { PLANS, type PlanId } from "@pulse/shared-types";
import { db } from "../db";
import { randomToken } from "../crypto";
import { writeAuditLog } from "../audit";
import type { BillingProvider } from "./provider";

/**
 * Local simulated billing rail — same server-side shape as a real Razorpay
 * integration (order -> confirm/webhook -> entitlement write), used because
 * no live merchant keys exist in this environment. Never collects card/UPI
 * details. See QUESTIONS.md #6.
 */
export const localBillingProvider: BillingProvider = {
  isConfigured() {
    return true;
  },

  async createCheckoutOrder(userId, planId, interval) {
    const plan = PLANS[planId];
    const price = interval === "monthly" ? plan.priceMonthly : plan.priceYearly;
    if (!price) throw new Error(`Plan ${planId} has no ${interval} price.`);
    return {
      orderId: `local_order_${randomToken(8)}`,
      amount: price.amount,
      currency: price.currency,
      isTestMode: true,
    };
  },

  async confirmPayment(userId, orderId, planId, interval) {
    // Idempotent on orderId — a real Razorpay webhook can be delivered more
    // than once for the same event; replaying it must not create a second
    // invoice or entitlement write. Instructions.md §4.
    const existingInvoice = await db.invoice.findFirst({ where: { razorpayOrderId: orderId } });
    if (existingInvoice) return { invoiceId: existingInvoice.id };

    const plan = PLANS[planId];
    const price = interval === "monthly" ? plan.priceMonthly : plan.priceYearly;
    if (!price) throw new Error(`Plan ${planId} has no ${interval} price.`);

    const periodDays = interval === "monthly" ? 30 : 365;
    const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

    await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: "active",
        interval,
        currency: price.currency,
        isTestMode: true,
        currentPeriodEnd,
      },
      update: {
        planId,
        status: "active",
        interval,
        currency: price.currency,
        currentPeriodEnd,
        cancelledAt: null,
      },
    });

    const invoice = await db.invoice.create({
      data: {
        userId,
        planId,
        amount: String(price.amount),
        currency: price.currency,
        status: "paid",
        razorpayOrderId: orderId,
        razorpayPaymentId: `local_payment_${randomToken(8)}`,
        webhookEventId: `local_webhook_${randomToken(8)}`,
      },
    });

    await writeAuditLog(userId, "billing_event", { event: "subscription_activated", planId, orderId, invoiceId: invoice.id });
    return { invoiceId: invoice.id };
  },

  async cancelSubscription(userId) {
    await db.subscription.update({ where: { userId }, data: { status: "cancelled", cancelledAt: new Date() } });
    await writeAuditLog(userId, "billing_event", { event: "subscription_cancelled" });
  },
};

export function getBillingProvider(): BillingProvider {
  // Real Razorpay adapter would be selected here when RAZORPAY_KEY_ID is set.
  return localBillingProvider;
}
