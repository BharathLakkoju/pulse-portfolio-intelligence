import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();

  const country = String(form.get("country") || "IN");
  const taxResidency = String(form.get("taxResidency") || "IN");
  const baseCurrency = String(form.get("baseCurrency") || "INR");
  const investorProfile = String(form.get("investorProfile") || "investor");

  await db.user.update({
    where: { id: user.id },
    data: { country, taxResidency, baseCurrency, investorProfile, onboardingComplete: true },
  });

  const portfolioCount = await db.portfolio.count({ where: { userId: user.id } });
  if (portfolioCount === 0) {
    await db.portfolio.create({ data: { userId: user.id, name: "My Portfolio", baseCurrency, dashboardKind: "long_term" } });
  }

  await writeAuditLog(user.id, "consent_change", { event: "onboarding_completed", country, baseCurrency });

  return NextResponse.redirect(new URL("/overview", req.url), 303);
}
