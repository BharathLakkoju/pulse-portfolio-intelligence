import { NextResponse } from "next/server";
import { requireUser, getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await requireUser();
  await writeAuditLog(user.id, "data_deletion", { event: "account_deleted" });
  await db.user.delete({ where: { id: user.id } });

  const session = await getSession();
  session.destroy();

  return NextResponse.redirect(new URL("/signin?error=Account deleted.", req.url), 303);
}
