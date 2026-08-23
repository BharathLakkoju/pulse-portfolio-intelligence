import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { readObject } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const report = await db.savedReport.findFirst({ where: { id: params.id, userId: user.id } });
  if (!report) return new Response("Not found", { status: 404 });

  const buffer = await readObject(report.storageRef);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[report.format] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${report.kind}.${report.format}"`,
    },
  });
}
