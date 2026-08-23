import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { db } from "@/lib/db";
import { listConnectors } from "@/lib/connectors/registry";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/Disclaimer";
import { formatDate } from "@/lib/format";

const STATUS_TONE: Record<string, "good" | "warn" | "bad" | "neutral"> = {
  healthy: "good",
  delayed: "neutral",
  reconnect_required: "warn",
  partial_data: "warn",
  failed: "bad",
  retired: "neutral",
};

export default async function ConnectionsPage({ searchParams }: { searchParams: { portfolio?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);

  const accounts = active ? await db.account.findMany({ where: { portfolioId: active.id }, orderBy: { connectedAt: "desc" } }) : [];
  const documents = active ? await db.documentUpload.findMany({ where: { portfolioId: active.id }, orderBy: { uploadedAt: "desc" } }) : [];
  const needsReview = active ? await db.transaction.count({ where: { portfolioId: active.id, reconciliationState: "needs_review" } }) : 0;

  return (
    <div className="space-y-6">
      <PortfolioHeader title="Connections" subtitle="Every source is read-only — Pulse never requests trade, transfer, or withdrawal access" portfolios={portfolios} activeId={active?.id ?? ""} />

      <DemoBanner text="Only two demo connectors exist in this build (no real broker/exchange commercial agreements are in place yet — see QUESTIONS.md #3). They generate simulated transactions through the same read-only, consent-gated pipeline a real connector would use." />

      {!active ? (
        <EmptyState title="No portfolio yet" body="Complete onboarding first." />
      ) : (
        <>
          <Card title="Available sources">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {listConnectors().map((c) => (
                <div key={c.id} className="rounded-lg border border-pulse-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{c.displayName}</p>
                    <Badge tone="warn">Demo</Badge>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-pulse-muted">
                    {c.scopes.map((s) => (
                      <li key={s.id}>✓ {s.label} <span className="text-pulse-good">(read-only)</span></li>
                    ))}
                  </ul>
                  <form action="/api/connections/connect" method="post" className="mt-3 flex gap-2">
                    <input type="hidden" name="portfolioId" value={active.id} />
                    <input type="hidden" name="connectorId" value={c.id} />
                    <input name="accountName" placeholder="Nickname (optional)" className="flex-1 rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-xs" />
                    <button type="submit" className="rounded-lg bg-pulse-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">Connect (simulated)</button>
                  </form>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Connected accounts">
            {accounts.length === 0 ? (
              <EmptyState title="No accounts connected yet" />
            ) : (
              <div className="space-y-2">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between rounded-lg border border-pulse-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{acc.name}</p>
                      <p className="text-xs text-pulse-muted capitalize">{acc.sourceType.replace("_", " ")} · scopes: {acc.scopesGranted.split(",").join(", ")} · {acc.lastSyncAt ? `synced ${formatDate(acc.lastSyncAt)}` : "never synced"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[acc.status] ?? "neutral"}>{acc.status.replace("_", " ")}</Badge>
                      {acc.status !== "retired" && (
                        <>
                          {acc.isDemo && (
                            <form action={`/api/connections/${acc.id}/resync`} method="post">
                              <button type="submit" className="rounded border border-pulse-border px-2 py-1 text-xs hover:bg-pulse-surfaceAlt">Resync</button>
                            </form>
                          )}
                          <form action={`/api/connections/${acc.id}/revoke`} method="post">
                            <button type="submit" className="rounded border border-pulse-bad/40 px-2 py-1 text-xs text-pulse-bad hover:bg-pulse-bad/10">Revoke</button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Statement / CAS upload">
            <form action="/api/documents/upload" method="post" encType="multipart/form-data" className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="portfolioId" value={active.id} />
              <input type="file" name="file" accept=".pdf,.csv" required className="text-sm text-pulse-muted file:mr-3 file:rounded-lg file:border-0 file:bg-pulse-surfaceAlt file:px-3 file:py-1.5 file:text-pulse-text" />
              <button type="submit" className="rounded-lg border border-pulse-border px-3 py-2 text-sm hover:bg-pulse-surfaceAlt">Upload</button>
            </form>
            <p className="mt-2 text-xs text-pulse-muted">No PDF parser is wired up yet (see QUESTIONS.md #5) — uploads land in the reconciliation queue below for manual review rather than being silently parsed.</p>
            {documents.length > 0 && (
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id} className="border-b border-pulse-border/50">
                      <td className="py-1.5 pr-3">{d.filename}</td>
                      <td className="py-1.5 pr-3">{formatDate(d.uploadedAt)}</td>
                      <td className="py-1.5 pr-3"><Badge tone={d.status === "parsed" ? "good" : d.status === "failed" ? "bad" : "warn"}>{d.status.replace("_", " ")}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Reconciliation queue">
            <p className="text-sm text-pulse-muted">{needsReview} transaction(s) flagged for review (low parse confidence or suspected duplicates).</p>
          </Card>
        </>
      )}
    </div>
  );
}
