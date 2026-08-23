import type { PlanId } from "@pulse/shared-types";

/**
 * Billing provider seam. A real integration implements this against the
 * Razorpay Orders/Subscriptions API + webhook signature verification. Today
 * only LocalSimulatedBillingProvider exists (no RAZORPAY_KEY_ID configured)
 * — see QUESTIONS.md #6. Entitlements are still enforced server-side
 * regardless of which provider is active (lib/entitlements.ts reads the DB,
 * never client state).
 */
export interface CheckoutOrder {
  orderId: string;
  amount: number;
  currency: string;
  isTestMode: boolean;
}

export interface BillingProvider {
  isConfigured(): boolean;
  createCheckoutOrder(userId: string, planId: PlanId, interval: "monthly" | "yearly"): Promise<CheckoutOrder>;
  /** In real Razorpay this is invoked by a signed webhook; the local provider calls it directly from the simulated checkout UI. */
  confirmPayment(userId: string, orderId: string, planId: PlanId, interval: "monthly" | "yearly"): Promise<{ invoiceId: string }>;
  cancelSubscription(userId: string): Promise<void>;
}
