import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();
  const portfolioId = String(form.get("portfolioId") || "");
  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

  const entries: Array<{ category: string; weight: number }> = [];
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("target_")) continue;
    const raw = String(value).trim();
    if (raw === "") continue;
    const pct = Number(raw);
    if (!Number.isFinite(pct) || pct < 0) continue;
    entries.push({ category: key.replace("target_", ""), weight: pct / 100 });
  }

  for (const e of entries) {
    await db.targetAllocation.upsert({
      where: { portfolioId_category: { portfolioId, category: e.category } },
      create: { portfolioId, category: e.category, targetWeight: e.weight },
      update: { targetWeight: e.weight },
    });
  }

  await writeAuditLog(user.id, "connection_change", { event: "target_allocation_updated", portfolioId, entries });

  return NextResponse.redirect(new URL(`/analyze/rebalance?portfolio=${portfolioId}`, req.url), 303);
}
