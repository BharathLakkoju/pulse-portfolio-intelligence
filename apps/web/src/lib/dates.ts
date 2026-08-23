export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** India financial year: Apr 1 - Mar 31. Returns e.g. "FY2025-26" for a date of 2025-08-01. */
export function indiaFinancialYear(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth(); // 0-indexed, 3 = April
  const startYear = m >= 3 ? y : y - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `FY${startYear}-${endYearShort}`;
}

export function periodStartDate(period: string, now: Date): Date | null {
  const d = new Date(now);
  switch (period) {
    case "1D":
      return addDays(d, -1);
    case "1W":
      return addDays(d, -7);
    case "1M":
      return addDays(d, -30);
    case "3M":
      return addDays(d, -91);
    case "6M":
      return addDays(d, -182);
    case "1Y":
      return addDays(d, -365);
    case "3Y":
      return addDays(d, -365 * 3);
    case "5Y":
      return addDays(d, -365 * 5);
    case "ALL":
      return null;
    default:
      return null;
  }
}
