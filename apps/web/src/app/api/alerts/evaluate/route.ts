import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { evaluateAlertsForUser } from "@/lib/alerts";

export async function POST(req: Request) {
  const user = await requireUser();
  await evaluateAlertsForUser(user.id);
  return NextResponse.redirect(new URL("/alerts", req.url), 303);
}
