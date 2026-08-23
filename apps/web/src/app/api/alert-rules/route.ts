import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await requireUser();
  const form = await req.formData();

  await db.alertRule.create({
    data: {
      userId: user.id,
      type: String(form.get("type") || "drift"),
      thresholdValue: form.get("thresholdValue") ? Number(form.get("thresholdValue")) : null,
      channel: String(form.get("channel") || "in_app"),
      frequencyCap: String(form.get("frequencyCap") || "realtime"),
    },
  });

  return NextResponse.redirect(new URL("/settings/alerts", req.url), 303);
}
