import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getEntitlements } from "@/lib/entitlements";
import { answerPortfolioQuestion } from "@/lib/ai/explainer";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();
  const portfolioId = String(form.get("portfolioId") || "");
  const question = String(form.get("question") || "").trim();

  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  if (!portfolio || !question) return NextResponse.redirect(new URL(`/ai?portfolio=${portfolioId}`, req.url), 303);

  const { plan } = await getEntitlements(user.id);
  const todayCount = await db.aiQuery.count({ where: { userId: user.id, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } });
  if (todayCount >= plan.aiExplainerDailyLimit) {
    await db.aiQuery.create({ data: { userId: user.id, question, intent: "rate_limited", answer: "Daily question limit reached for your plan. Upgrade for a higher limit.", groundingJson: "{}" } });
    return NextResponse.redirect(new URL(`/ai?portfolio=${portfolioId}`, req.url), 303);
  }

  const result = await answerPortfolioQuestion(user.id, portfolioId, question);
  await db.aiQuery.create({
    data: { userId: user.id, question, intent: result.intent, answer: result.answer, groundingJson: JSON.stringify(result.grounding) },
  });

  return NextResponse.redirect(new URL(`/ai?portfolio=${portfolioId}`, req.url), 303);
}
