/**
 * Instructions.md §7: "reviewers should grep for phrases like 'you should
 * invest', 'we recommend buying/selling', 'guaranteed return' before merging
 * copy changes." This is that grep, runnable in code so the AI explainer and
 * any future free-text surface can self-check before rendering.
 */
const ADVICE_PATTERNS: RegExp[] = [
  /\byou should (buy|sell|invest|hold)\b/i,
  /\bwe recommend (buying|selling)\b/i,
  /\bguaranteed returns?\b/i,
  /\bwill definitely (rise|fall|go up|go down)\b/i,
  /\bbest stock to buy\b/i,
  /\bwhat should i invest in\b/i,
  /\bprice target\b/i,
  /\bsure(-| )shot\b/i,
];

export function containsAdviceLanguage(text: string): boolean {
  return ADVICE_PATTERNS.some((p) => p.test(text));
}

export const DISALLOWED_INTENT_KEYWORDS = [
  "should i buy",
  "should i sell",
  "should i hold",
  "what should i invest",
  "what stock should",
  "recommend a stock",
  "price prediction",
  "will it go up",
  "will it go down",
  "buy or sell",
  "place an order",
  "execute a trade",
];

export function isDisallowedFinancialAdviceQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return DISALLOWED_INTENT_KEYWORDS.some((k) => q.includes(k));
}

export const GENERIC_DISCLAIMER =
  "Pulse is a portfolio tracker and educational-analytics tool, not a registered investment adviser. Nothing here is personalised investment advice, a recommendation to buy or sell, or a guarantee of future performance.";
