import Link from "next/link";
import { Badge } from "@/components/ui/Card";

export function TopBar({
  user,
  planName,
}: {
  user: { name: string | null; email: string };
  planName: string;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-pulse-border bg-pulse-surface px-4">
      <div className="flex items-center gap-3">
        <Badge tone="accent">{planName} plan</Badge>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/alerts" className="text-sm text-pulse-muted hover:text-pulse-text" aria-label="Alerts">
          🔔
        </Link>
        <span className="text-sm text-pulse-muted">{user.name || user.email}</span>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="rounded-lg border border-pulse-border px-2 py-1 text-xs text-pulse-muted hover:text-pulse-text">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
