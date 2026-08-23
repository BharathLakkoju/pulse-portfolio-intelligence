import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { SubNav } from "@/components/shell/SubNav";
import { Card } from "@/components/ui/Card";
import { SUPPORTED_BASE_CURRENCIES } from "@pulse/shared-types";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <div className="max-w-2xl space-y-6">
      <SubNav
        items={[
          { href: "/settings/profile", label: "Profile" },
          { href: "/settings/alerts", label: "Alerts" },
          { href: "/settings/billing", label: "Billing" },
          { href: "/settings/privacy", label: "Privacy & data" },
        ]}
        activeHref="/settings/profile"
      />
      <h1 className="text-xl font-semibold">Profile</h1>

      <Card>
        <form action="/api/settings/profile" method="post" className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-pulse-muted">Name</label>
            <input name="name" defaultValue={user.name ?? ""} className="w-full rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-pulse-muted">Email</label>
            <input value={user.email} disabled className="w-full rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm text-pulse-muted" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-pulse-muted">Base currency</label>
              <select name="baseCurrency" defaultValue={user.baseCurrency} className="w-full rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm">
                {SUPPORTED_BASE_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-pulse-muted">Investor profile</label>
              <select name="investorProfile" defaultValue={user.investorProfile} className="w-full rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-sm">
                {["investor", "trader", "crypto", "nri_global", "advisor_ca"].map((p) => (
                  <option key={p} value={p}>{p.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="rounded-lg bg-pulse-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
        </form>
      </Card>

      <Card title="Security">
        <div className="flex items-center justify-between text-sm">
          <span>Multi-factor authentication (passkey / authenticator app)</span>
          <span className="text-xs text-pulse-warn">Not yet available — see QUESTIONS.md #7</span>
        </div>
      </Card>
    </div>
  );
}
