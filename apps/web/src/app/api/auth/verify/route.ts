import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/signin?error=Missing token.", req.url), 303);
  }

  const result = await consumeMagicLink(token);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(result.reason)}`, req.url), 303);
  }

  const user = await db.user.findUnique({ where: { id: result.userId } });
  const dest = user && !user.onboardingComplete ? "/onboarding" : "/overview";
  return NextResponse.redirect(new URL(dest, req.url), 303);
}
