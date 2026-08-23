import { NextResponse } from "next/server";
import { requestMagicLink } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim();
  if (!email || !email.includes("@")) {
    return NextResponse.redirect(new URL("/signin?error=Enter a valid email address.", req.url), 303);
  }
  await requestMagicLink(email);
  return NextResponse.redirect(new URL(`/dev-inbox?email=${encodeURIComponent(email.toLowerCase())}`, req.url), 303);
}
