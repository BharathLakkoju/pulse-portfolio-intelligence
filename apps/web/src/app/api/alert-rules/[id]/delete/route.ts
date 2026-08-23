import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  await db.alertRule.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.redirect(new URL("/settings/alerts", req.url), 303);
}
