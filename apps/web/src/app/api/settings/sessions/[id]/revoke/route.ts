import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { revokeSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  await revokeSession(user.id, params.id);
  return NextResponse.redirect(new URL("/settings/privacy", req.url), 303);
}
