import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/Disclaimer";

export default async function DevInboxPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email?.toLowerCase();
  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  const link = user
    ? await db.magicLink.findFirst({ where: { userId: user.id, consumedAt: null }, orderBy: { createdAt: "desc" } })
    : null;

  return (
    <Card>
      <h1 className="text-lg font-semibold text-pulse-text">Dev Inbox</h1>
      <p className="mt-1 text-sm text-pulse-muted">Stands in for your email inbox in this local demo.</p>
      <div className="mt-4">
        <DemoBanner text="In production this link is emailed to you. Here it's shown directly so the sign-in flow is testable without an SMTP provider." />
      </div>

      {link ? (
        <div className="mt-4 rounded-lg border border-pulse-border bg-pulse-surfaceAlt p-4">
          <p className="text-sm text-pulse-text">Sign-in link for {email}:</p>
          <Link href={`/api/auth/verify?token=${link.token}`} className="mt-2 block break-all rounded-lg bg-pulse-accent px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90">
            Click to sign in →
          </Link>
          <p className="mt-2 text-xs text-pulse-muted">Expires {link.expiresAt.toLocaleTimeString()}. Single use.</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-pulse-muted">No pending link found for this email. Request one from the sign-in page.</p>
      )}

      <Link href="/signin" className="mt-4 block text-center text-xs text-pulse-accent hover:underline">
        ← Back to sign in
      </Link>
    </Card>
  );
}
