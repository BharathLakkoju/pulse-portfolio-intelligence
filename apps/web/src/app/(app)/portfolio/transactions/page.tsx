import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resolveActivePortfolio } from "@/lib/context";
import { db } from "@/lib/db";
import { PortfolioHeader } from "@/components/shell/PortfolioHeader";
import { SubNav } from "@/components/shell/SubNav";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/format";
import { GENERIC_CSV_HEADERS } from "@/lib/csv";

const RECON_TONE: Record<string, "good" | "warn" | "bad" | "neutral"> = {
  clean: "good",
  needs_review: "warn",
  duplicate_suspected: "warn",
  resolved: "neutral",
  corrected: "neutral",
};

export default async function TransactionsPage({ searchParams }: { searchParams: { portfolio?: string; type?: string; importSummary?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const { portfolios, active } = await resolveActivePortfolio(user, searchParams.portfolio);
  if (!active) redirect("/connections");

  const accounts = await db.account.findMany({ where: { portfolioId: active.id } });
  const transactions = await db.transaction.findMany({
    where: { portfolioId: active.id, ...(searchParams.type ? { eventType: searchParams.type } : {}) },
    include: { instrument: true, account: true },
    orderBy: { occurredAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <SubNav
        items={[
          { href: "/portfolio/holdings", label: "Holdings" },
          { href: "/portfolio/accounts", label: "Accounts" },
          { href: "/portfolio/transactions", label: "Transactions" },
        ]}
        activeHref="/portfolio/transactions"
        portfolioId={active.id}
      />
      <PortfolioHeader title="Transactions" subtitle={`${transactions.length} shown (immutable ledger — corrections are new adjustment records)`} portfolios={portfolios} activeId={active.id} />
      {searchParams.importSummary && (
        <div className="rounded-lg border border-pulse-good/30 bg-pulse-good/10 px-3 py-2 text-sm text-pulse-good">{decodeURIComponent(searchParams.importSummary)}</div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Add a manual transaction">
          <form action="/api/transactions/manual" method="post" className="space-y-2">
            <input type="hidden" name="portfolioId" value={active.id} />
            <div className="grid grid-cols-2 gap-2">
              <select name="accountId" required className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <select name="eventType" required className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm">
                {["buy", "sell", "dividend", "interest", "fee", "transfer_in", "transfer_out", "split", "airdrop", "staking_reward", "withholding_tax"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="occurredAt" type="date" required className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" />
              <input name="currency" defaultValue={active.baseCurrency} className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" placeholder="Currency" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="symbol" placeholder="Symbol (e.g. RELIANCE)" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" />
              <input name="exchange" placeholder="Exchange (e.g. NSE)" defaultValue="NSE" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input name="quantity" placeholder="Quantity" defaultValue="0" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" />
              <input name="unitPrice" placeholder="Unit price" defaultValue="0" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" />
              <input name="grossAmount" placeholder="Gross amount" required className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="feeAmount" placeholder="Fee" defaultValue="0" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" />
              <input name="taxAmount" placeholder="Tax" defaultValue="0" className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-pulse-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90">Add transaction</button>
          </form>
        </Card>

        <Card title="Import a CSV">
          <form action="/api/import/csv" method="post" encType="multipart/form-data" className="space-y-3">
            <input type="hidden" name="portfolioId" value={active.id} />
            <input type="hidden" name="accountId" value={accounts[0]?.id ?? ""} />
            <p className="text-xs text-pulse-muted">
              Generic schema columns: <code className="text-pulse-text">{GENERIC_CSV_HEADERS.join(", ")}</code>
            </p>
            <input type="file" name="file" accept=".csv,text/csv" required className="w-full text-sm text-pulse-muted file:mr-3 file:rounded-lg file:border-0 file:bg-pulse-surfaceAlt file:px-3 file:py-1.5 file:text-pulse-text" />
            <button type="submit" className="w-full rounded-lg border border-pulse-border px-3 py-2 text-sm font-medium hover:bg-pulse-surfaceAlt">Upload &amp; import</button>
          </form>
        </Card>
      </div>

      <Card title="Ledger">
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" />
        ) : (
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-pulse-surface">
                <tr className="border-b border-pulse-border text-left text-xs text-pulse-muted">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Instrument</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">Gross</th>
                  <th className="py-2 pr-4">Fee</th>
                  <th className="py-2 pr-4">Tax</th>
                  <th className="py-2 pr-4">Account</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-pulse-border/50">
                    <td className="py-1.5 pr-4">{formatDate(t.occurredAt)}</td>
                    <td className="py-1.5 pr-4">{t.eventType}</td>
                    <td className="py-1.5 pr-4">{t.instrument?.symbol ?? "—"}</td>
                    <td className="py-1.5 pr-4">{t.quantity}</td>
                    <td className="py-1.5 pr-4">{formatMoney(t.grossAmount, t.currency)}</td>
                    <td className="py-1.5 pr-4">{formatMoney(t.feeAmount, t.currency)}</td>
                    <td className="py-1.5 pr-4">{formatMoney(t.taxAmount, t.currency)}</td>
                    <td className="py-1.5 pr-4">{t.account.name}</td>
                    <td className="py-1.5 pr-4 text-pulse-muted">{t.sourceId}</td>
                    <td className="py-1.5 pr-4">
                      <Badge tone={RECON_TONE[t.reconciliationState] ?? "neutral"}>{t.reconciliationState.replace("_", " ")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
