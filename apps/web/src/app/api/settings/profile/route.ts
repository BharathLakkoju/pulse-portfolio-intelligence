import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();

  await db.user.update({
    where: { id: user.id },
    data: {
      name: String(form.get("name") || "") || null,
      baseCurrency: String(form.get("baseCurrency") || user.baseCurrency),
      investorProfile: String(form.get("investorProfile") || user.investorProfile),
    },
  });

  return NextResponse.redirect(new URL("/settings/profile", req.url), 303);
}
