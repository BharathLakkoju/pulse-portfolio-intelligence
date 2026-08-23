import { Card } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/Disclaimer";

export default function SignInPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <Card>
      <h1 className="text-lg font-semibold text-pulse-text">Sign in</h1>
      <p className="mt-1 text-sm text-pulse-muted">Passwordless — we'll create an account automatically if you're new.</p>

      <form action="/api/auth/request-link" method="post" className="mt-4 space-y-3">
        <div>
          <label htmlFor="email" className="mb-1 block text-xs text-pulse-muted">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue="demo@pulse.app"
            className="w-full rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm text-pulse-text outline-none focus:border-pulse-accent"
            placeholder="you@example.com"
          />
        </div>
        {searchParams.error && <p className="text-xs text-pulse-bad">{searchParams.error}</p>}
        <button type="submit" className="w-full rounded-lg bg-pulse-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90">
          Continue with email
        </button>
      </form>

      <div className="mt-4">
        <DemoBanner text="No email is actually sent (no SMTP configured). Continuing takes you to a Dev Inbox with your one-time sign-in link — see QUESTIONS.md #7. Try demo@pulse.app to explore the pre-seeded demo portfolios." />
      </div>
    </Card>
  );
}
