import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();
  const portfolioId = String(form.get("portfolioId") || "");
  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

  await db.goal.create({
    data: {
      portfolioId,
      name: String(form.get("name") || "Goal"),
      type: String(form.get("type") || "custom"),
      targetAmount: String(form.get("targetAmount") || "0"),
      targetDate: new Date(String(form.get("targetDate") || new Date().toISOString())),
      contributionAmount: String(form.get("contributionAmount") || "0"),
      contributionFrequency: String(form.get("contributionFrequency") || "monthly"),
    },
  });

  return NextResponse.redirect(new URL(`/plan/goals?portfolio=${portfolioId}`, req.url), 303);
}
