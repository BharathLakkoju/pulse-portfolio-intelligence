import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { saveObject } from "@/lib/storage";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();
  const portfolioId = String(form.get("portfolioId") || "");
  const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const file = form.get("file") as File | null;
  if (!file) return NextResponse.redirect(new URL(`/connections?portfolio=${portfolioId}`, req.url), 303);

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageRef = await saveObject(`documents/${portfolioId}`, file.name, buffer);

  // No PDF/CSV statement parser is wired up (see QUESTIONS.md #5) — every
  // upload is routed to manual review rather than fabricating parsed
  // transactions from a document nobody actually parsed.
  await db.documentUpload.create({ data: { portfolioId, filename: file.name, storageRef, status: "pending_review" } });
  await writeAuditLog(user.id, "connection_change", { event: "document_uploaded", portfolioId, filename: file.name });

  return NextResponse.redirect(new URL(`/connections?portfolio=${portfolioId}`, req.url), 303);
}
