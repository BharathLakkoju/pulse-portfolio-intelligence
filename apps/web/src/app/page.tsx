import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardingComplete ? "/overview" : "/onboarding");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 text-3xl font-bold text-pulse-accent">Pulse</div>
      <h1 className="text-3xl font-semibold text-pulse-text md:text-4xl">Know the pulse of your money.</h1>
      <p className="mt-4 max-w-xl text-pulse-muted">
        What you own, how it performs, where the risk is, and what deserves attention — across brokers, mutual funds, crypto,
        and manual assets. Read-only, always. Never a trading platform, never custody of your funds.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/signin" className="rounded-lg bg-pulse-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
          Get started
        </Link>
        <Link href="/signin" className="rounded-lg border border-pulse-border px-5 py-2.5 text-sm font-medium text-pulse-text hover:bg-pulse-surfaceAlt">
          Sign in
        </Link>
      </div>
      <p className="mt-10 max-w-lg text-xs text-pulse-muted">
        Pulse is a portfolio tracking and educational-analytics tool — not a trading platform, custodian, or personalised
        investment adviser. See the in-app disclaimers on every metric and report.
      </p>
    </main>
  );
}
