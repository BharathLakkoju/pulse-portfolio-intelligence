import Decimal from "decimal.js";

const CURRENCY_LOCALE: Record<string, string> = { INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB", AED: "ar-AE", SGD: "en-SG" };

export function formatMoney(value: Decimal | string | number, currency = "INR", maxFractionDigits = 2): string {
  const num = value instanceof Decimal ? value.toNumber() : Number(value);
  if (!Number.isFinite(num)) return "—";
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: maxFractionDigits,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(maxFractionDigits)}`;
  }
}

export function formatNumber(value: Decimal | string | number, maxFractionDigits = 2): string {
  const num = value instanceof Decimal ? value.toNumber() : Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: maxFractionDigits }).format(num);
}

export function formatPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", opts);
}

export function signedClass(value: number | Decimal | null | undefined): "good" | "bad" | "neutral" {
  const num = value instanceof Decimal ? value.toNumber() : value;
  if (num === null || num === undefined || Number.isNaN(num) || num === 0) return "neutral";
  return num > 0 ? "good" : "bad";
}
