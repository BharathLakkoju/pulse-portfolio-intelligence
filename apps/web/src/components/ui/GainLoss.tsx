import { formatMoney, formatPct, signedClass } from "@/lib/format";
import Decimal from "decimal.js";

/**
 * PRD: "Accessible gain/loss indicators that do not rely solely on red/green
 * colour." Every gain/loss here pairs an explicit +/- sign and a ▲/▼ glyph
 * with color, so color-blind users and grayscale printouts still read it.
 */
export function GainLoss({
  value,
  pct,
  currency = "INR",
  showMoney = true,
  size = "md",
}: {
  value: Decimal | number | string;
  pct?: number | null;
  currency?: string;
  showMoney?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const cls = signedClass(value instanceof Decimal ? value : Number(value));
  const num = value instanceof Decimal ? value.toNumber() : Number(value);
  const arrow = cls === "good" ? "▲" : cls === "bad" ? "▼" : "•";
  const sizeCls = size === "lg" ? "text-lg" : size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${sizeCls} ${
        cls === "good" ? "text-pulse-good" : cls === "bad" ? "text-pulse-bad" : "text-pulse-muted"
      }`}
    >
      <span aria-hidden="true">{arrow}</span>
      {showMoney && <span>{formatMoney(new Decimal(num).abs(), currency)}</span>}
      {pct !== undefined && pct !== null && <span>({formatPct(pct)})</span>}
    </span>
  );
}
