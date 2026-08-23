import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getBillingProvider } from "@/lib/billing/local";
import type { PlanId } from "@pulse/shared-types";

/**
 * Local TEST MODE checkout: creates a simulated order and confirms it
 * immediately (no real payment collection exists). A live Razorpay adapter
 * would instead redirect to Razorpay Checkout and confirm via a signed
 * webhook. See QUESTIONS.md #6.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();
  const planId = String(form.get("planId") || "free") as PlanId;
  const interval = (String(form.get("interval") || "monthly") as "monthly" | "yearly");

  const provider = getBillingProvider();
  const order = await provider.createCheckoutOrder(user.id, planId, interval);
  await provider.confirmPayment(user.id, order.orderId, planId, interval);

  return NextResponse.redirect(new URL("/settings/billing", req.url), 303);
}
