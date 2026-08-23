/**
 * Region-aware configuration — CLAUDE.md principle 4: "Currency, benchmark,
 * tax-classification, and date-handling logic is region-aware configuration,
 * never hardcoded constants." This is the seam Release 3 (international
 * expansion) plugs into. Only "IN" is populated with real defaults today;
 * see QUESTIONS.md #11 for why other regions are scaffolded, not built.
 */

export interface HoldingPeriodRule {
  assetClass: string;
  longTermThresholdDays: number;
  shortTermRateNote: string;
  longTermRateNote: string;
}

export interface RegionTaxConfig {
  country: string; // ISO 3166-1 alpha-2
  currency: string; // ISO 4217
  costBasisMethod: "FIFO" | "LIFO" | "AVERAGE" | "SPECIFIC_LOT";
  holdingPeriodRules: HoldingPeriodRule[];
  taxLogicReviewed: boolean; // must stay false until a qualified CA/tax pro signs off
  disclaimer: string;
}

export interface RegionBenchmarkConfig {
  country: string;
  defaultBenchmarkId: string;
  availableBenchmarkIds: string[];
}

export const REGION_TAX_CONFIG: Record<string, RegionTaxConfig> = {
  IN: {
    country: "IN",
    currency: "INR",
    costBasisMethod: "FIFO",
    // Default config only — CA review pending, see QUESTIONS.md #8.
    holdingPeriodRules: [
      {
        assetClass: "equity",
        longTermThresholdDays: 365,
        shortTermRateNote: "STCG on listed equity — flat rate per current Finance Act (config, unreviewed)",
        longTermRateNote: "LTCG on listed equity above exemption threshold (config, unreviewed)",
      },
      {
        assetClass: "etf",
        longTermThresholdDays: 365,
        shortTermRateNote: "Treated as listed equity ETF for holding period (config, unreviewed)",
        longTermRateNote: "Treated as listed equity ETF for holding period (config, unreviewed)",
      },
      {
        assetClass: "mutual_fund",
        longTermThresholdDays: 365,
        shortTermRateNote: "Equity-oriented fund default; debt funds follow separate config (unreviewed)",
        longTermRateNote: "Equity-oriented fund default; debt funds follow separate config (unreviewed)",
      },
      {
        assetClass: "crypto",
        longTermThresholdDays: 0,
        shortTermRateNote: "VDA flat-rate regime — no long-term distinction in current config (unreviewed)",
        longTermRateNote: "VDA flat-rate regime — no long-term distinction in current config (unreviewed)",
      },
      {
        assetClass: "gold",
        longTermThresholdDays: 1095,
        shortTermRateNote: "Physical/digital gold slab-rate default (config, unreviewed)",
        longTermRateNote: "Physical/digital gold LTCG default (config, unreviewed)",
      },
    ],
    taxLogicReviewed: false,
    disclaimer:
      "Estimate only. This capital-gains calculation uses configurable assumptions that have not yet been reviewed by a qualified CA or tax professional. Do not file using these numbers without professional review.",
  },
};

export const REGION_BENCHMARK_CONFIG: Record<string, RegionBenchmarkConfig> = {
  IN: {
    country: "IN",
    defaultBenchmarkId: "NIFTY50",
    availableBenchmarkIds: ["NIFTY50", "NIFTY500", "SENSEX", "SP500", "MSCI_WORLD", "BTC", "CUSTOM_BLEND"],
  },
  US: {
    country: "US",
    defaultBenchmarkId: "SP500",
    availableBenchmarkIds: ["SP500", "MSCI_WORLD", "BTC", "CUSTOM_BLEND"],
  },
  GLOBAL: {
    country: "GLOBAL",
    defaultBenchmarkId: "MSCI_WORLD",
    availableBenchmarkIds: ["MSCI_WORLD", "SP500", "BTC", "CUSTOM_BLEND"],
  },
};

export const SUPPORTED_BASE_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"] as const;
export type SupportedBaseCurrency = (typeof SUPPORTED_BASE_CURRENCIES)[number];
