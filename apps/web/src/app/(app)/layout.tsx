import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getEntitlements } from "@/lib/entitlements";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!user.onboardingComplete) redirect("/onboarding");

  const portfolios = await db.portfolio.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const { plan } = await getEntitlements(user.id);

  return (
    <div className="flex min-h-screen">
      <Sidebar portfolioId={portfolios[0]?.id} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar user={user} planName={plan.name} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
