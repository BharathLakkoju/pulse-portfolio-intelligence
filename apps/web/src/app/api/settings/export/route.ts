import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await requireUser();

  const [portfolios, accounts, transactions, goals] = await Promise.all([
    db.portfolio.findMany({ where: { userId: user.id } }),
    db.account.findMany({ where: { portfolio: { userId: user.id } } }),
    db.transaction.findMany({ where: { portfolio: { userId: user.id } } }),
    db.goal.findMany({ where: { portfolio: { userId: user.id } } }),
  ]);

  await writeAuditLog(user.id, "export", { event: "full_data_export" });

  const payload = { exportedAt: new Date().toISOString(), user, portfolios, accounts, transactions, goals };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="pulse-data-export.json"' },
  });
}
