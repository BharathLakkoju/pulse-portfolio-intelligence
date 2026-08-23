import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getBillingProvider } from "@/lib/billing/local";

export async function POST(req: Request) {
  const user = await requireUser();
  await getBillingProvider().cancelSubscription(user.id);
  return NextResponse.redirect(new URL("/settings/billing", req.url), 303);
}
