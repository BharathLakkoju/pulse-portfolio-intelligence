import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  await db.alert.updateMany({ where: { id: params.id, userId: user.id }, data: { readAt: new Date() } });
  const referer = req.headers.get("referer");
  return NextResponse.redirect(referer || new URL("/alerts", req.url), 303);
}
