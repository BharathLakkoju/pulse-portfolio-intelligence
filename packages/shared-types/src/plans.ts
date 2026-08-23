/** Pricing/entitlement plan shape — mirrors PRD "Pricing and Monetization". */

export type PlanId = "free" | "pro_india" | "pro_global" | "premium";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthly: { amount: number; currency: string } | null;
  priceYearly: { amount: number; currency: string } | null;
  maxAccounts: number | "unlimited";
  maxConnections: number | "unlimited";
  refreshFrequency: "daily" | "intraday";
  advancedRisk: boolean;
  taxWorkspace: "none" | "basic_export" | "full";
  aiExplainerDailyLimit: number;
  scheduledReports: "none" | "monthly" | "monthly_quarterly_custom";
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: null,
    priceYearly: null,
    maxAccounts: 2,
    maxConnections: 1,
    refreshFrequency: "daily",
    advancedRisk: false,
    taxWorkspace: "none",
    aiExplainerDailyLimit: 3,
    scheduledReports: "none",
  },
  pro_india: {
    id: "pro_india",
    name: "Pro India",
    priceMonthly: { amount: 499, currency: "INR" },
    priceYearly: { amount: 4999, currency: "INR" },
    maxAccounts: 10,
    maxConnections: 5,
    refreshFrequency: "intraday",
    advancedRisk: true,
    taxWorkspace: "basic_export",
    aiExplainerDailyLimit: 50,
    scheduledReports: "monthly",
  },
  pro_global: {
    id: "pro_global",
    name: "Pro Global",
    priceMonthly: { amount: 9.99, currency: "USD" },
    priceYearly: { amount: 99, currency: "USD" },
    maxAccounts: 10,
    maxConnections: 5,
    refreshFrequency: "intraday",
    advancedRisk: true,
    taxWorkspace: "basic_export",
    aiExplainerDailyLimit: 50,
    scheduledReports: "monthly",
  },
  premium: {
    id: "premium",
    name: "Premium / Tax",
    priceMonthly: { amount: 999, currency: "INR" },
    priceYearly: { amount: 8999, currency: "INR" },
    maxAccounts: "unlimited",
    maxConnections: "unlimited",
    refreshFrequency: "intraday",
    advancedRisk: true,
    taxWorkspace: "full",
    aiExplainerDailyLimit: 200,
    scheduledReports: "monthly_quarterly_custom",
  },
};
