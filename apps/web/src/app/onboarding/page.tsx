import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { Disclaimer } from "@/components/ui/Disclaimer";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.onboardingComplete) redirect("/overview");

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="text-2xl font-bold text-pulse-accent">Pulse</div>
        <p className="mt-1 text-sm text-pulse-muted">A few details before we build your dashboard.</p>
      </div>

      <Card>
        <form action="/api/onboarding" method="post" className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-pulse-muted">Country</label>
            <select name="country" defaultValue="IN" className="w-full rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm">
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GLOBAL">Other / Global</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-pulse-muted">Tax residency</label>
            <select name="taxResidency" defaultValue="IN" className="w-full rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm">
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-pulse-muted">Base currency</label>
            <select name="baseCurrency" defaultValue="INR" className="w-full rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm">
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="SGD">SGD — Singapore Dollar</option>
              <option value="AED">AED — UAE Dirham</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-pulse-muted">Which best describes you?</label>
            <select name="investorProfile" defaultValue="investor" className="w-full rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm">
              <option value="investor">Long-term investor</option>
              <option value="trader">Active trader</option>
              <option value="crypto">Crypto investor</option>
              <option value="nri_global">NRI / Global investor</option>
              <option value="advisor_ca">Advisor / CA</option>
            </select>
          </div>

          <Disclaimer text="Pulse only ever requests read-only access to your accounts — never trade, transfer, or withdrawal permissions." />

          <button type="submit" className="w-full rounded-lg bg-pulse-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90">
            Continue
          </button>
        </form>
      </Card>
    </div>
  );
}
