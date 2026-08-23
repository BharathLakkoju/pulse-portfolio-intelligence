import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { accountId: string } }) {
  const user = await requireUser();
  const account = await db.account.findFirst({ where: { id: params.accountId, portfolio: { userId: user.id } } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.account.update({ where: { id: account.id }, data: { status: "retired", encryptedTokenRef: null } });
  await writeAuditLog(user.id, "connection_change", { event: "revoked", accountId: account.id });

  return NextResponse.redirect(new URL(`/connections?portfolio=${account.portfolioId}`, req.url), 303);
}
