/** Minimal RFC4180-ish CSV parser/writer — no external dependency needed for the generic import schema. */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (inQuotes) {
      if (c === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  return lines.join("\n");
}

/** Pulse generic transaction CSV schema (PRD "Broker CSV import"). */
export const GENERIC_CSV_HEADERS = [
  "date",
  "event_type",
  "symbol",
  "exchange",
  "quantity",
  "unit_price",
  "gross_amount",
  "fee_amount",
  "tax_amount",
  "currency",
  "account_name",
] as const;

export interface GenericCsvRow {
  date: string;
  event_type: string;
  symbol: string;
  exchange: string;
  quantity: string;
  unit_price: string;
  gross_amount: string;
  fee_amount: string;
  tax_amount: string;
  currency: string;
  account_name: string;
}

export interface CsvValidationError {
  rowNumber: number;
  message: string;
  raw: Record<string, string>;
}

const VALID_EVENT_TYPES = new Set([
  "buy",
  "sell",
  "dividend",
  "interest",
  "fee",
  "transfer_in",
  "transfer_out",
  "split",
  "merger",
  "spin_off",
  "airdrop",
  "staking_reward",
  "withholding_tax",
  "FX_conversion",
]);

export function parseGenericTransactionCsv(text: string): { valid: GenericCsvRow[]; errors: CsvValidationError[] } {
  const rows = parseCsv(text);
  if (rows.length === 0) return { valid: [], errors: [] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const valid: GenericCsvRow[] = [];
  const errors: CsvValidationError[] = [];

  for (let i = 1; i < rows.length; i++) {
    const rowNumber = i + 1;
    const raw: Record<string, string> = {};
    header.forEach((h, idx) => (raw[h] = (rows[i][idx] ?? "").trim()));

    const missing = GENERIC_CSV_HEADERS.filter((h) => h !== "exchange" && h !== "account_name" && !(h in raw));
    if (missing.length > 0) {
      errors.push({ rowNumber, message: `Missing required column(s): ${missing.join(", ")}`, raw });
      continue;
    }
    if (!raw.date || Number.isNaN(Date.parse(raw.date))) {
      errors.push({ rowNumber, message: `Invalid or missing date: "${raw.date}"`, raw });
      continue;
    }
    if (!VALID_EVENT_TYPES.has(raw.event_type)) {
      errors.push({ rowNumber, message: `Unrecognised event_type: "${raw.event_type}"`, raw });
      continue;
    }
    if (raw.event_type !== "fee" && raw.event_type !== "interest" && raw.event_type !== "withholding_tax" && !raw.symbol) {
      errors.push({ rowNumber, message: "Missing symbol for an instrument-linked event.", raw });
      continue;
    }
    for (const numField of ["quantity", "unit_price", "gross_amount", "fee_amount", "tax_amount"] as const) {
      const v = raw[numField];
      if (v && Number.isNaN(Number(v))) {
        errors.push({ rowNumber, message: `Non-numeric ${numField}: "${v}"`, raw });
      }
    }
    if (!raw.currency) {
      errors.push({ rowNumber, message: "Missing currency.", raw });
      continue;
    }

    valid.push({
      date: raw.date,
      event_type: raw.event_type,
      symbol: raw.symbol || "",
      exchange: raw.exchange || "NSE",
      quantity: raw.quantity || "0",
      unit_price: raw.unit_price || "0",
      gross_amount: raw.gross_amount || "0",
      fee_amount: raw.fee_amount || "0",
      tax_amount: raw.tax_amount || "0",
      currency: raw.currency,
      account_name: raw.account_name || "Imported",
    });
  }

  return { valid, errors };
}
