# CLAUDE.md — Pulse: Your Portfolio Intelligence

This file is the entry point for any AI coding agent (Claude Code, or otherwise) working in this repository. Read this first. For day-to-day workflow detail see `docs/Instructions.md`. For role-based work-splitting see `docs/Agents.md`. Both files assume everything in this document as ground truth.

## What Pulse is

A privacy-first, **read-only** portfolio tracking and analytics platform for retail investors (India-first, global-ready). It consolidates brokers, mutual funds, crypto exchanges, wallets, and manual entries, then explains performance, allocation, risk, tax exposure, and what needs attention. It is a tracker and educational-analytics product — **not** a trading platform, custodian, or personalised investment adviser.

Product promise: *"Know the pulse of your money: what you own, how it performs, where the risk is, and what deserves attention."*

## Hard non-goals (never implement without explicit sign-off)

- No placing, modifying, or executing trades.
- No holding user funds, custody, lending, or wallet functionality.
- No guaranteed returns, stock tips, price predictions, or personalised buy/sell/hold calls.
- No automated rebalancing *execution* (proposal/simulation only).
- No full multi-country tax filing (export-first only, India v1 estimate-only).
- Personalised investment advice requires SEBI Investment-Adviser (RIA) registration in India — do not add advice-shaped features without a legal/compliance gate.

## Non-negotiable product principles

1. **Read-only by default.** No connector ever requests trade, transfer, or withdrawal scopes. Never request or store crypto seed phrases/private keys or broker passwords where OAuth exists.
2. **Every number must explain itself.** Any user-visible metric (P&L, XIRR, TWRR, CAGR, risk score, tax estimate) must be able to show: formula/method, date range, base currency + FX approach, benchmark (if any), risk-free-rate assumption (if any), annualisation method, included/excluded accounts, and data coverage/quality warnings.
3. **Immutable ledger.** Transactions are never silently overwritten. Corrections are new adjustment/audit records that reference what they correct.
4. **Local truth.** Currency, benchmark, tax-classification, and date-handling logic is region-aware *configuration*, never hardcoded constants — this is what makes international expansion (Release 3) possible.
5. **Privacy earns retention.** No sale of portfolio data. Every connection shows its scope before consent and can be revoked by the user without contacting support.
6. **Progressive complexity.** Free tier = full basic ownership visibility (value, P&L, allocation, one insight). Advanced risk/tax/automation is what's paid — never gate basic access to a user's own recorded data.

## Suggested repository layout (monorepo)

```
apps/
  web/                # Next.js (TS) PWA — dashboard, holdings, tax workspace, settings
  api/                 # Node/NestJS (or FastAPI for calc-heavy services) — BFF + core platform
workers/
  ingestion/           # broker connectors, statement/CSV parsers, crypto indexers (queue-driven)
  pricing/             # market data + FX ingestion, corporate actions
  calc-engine/         # valuation, XIRR/TWRR/CAGR, risk metrics, tax-lot engine
  notifications/       # alert rules, digesting, delivery
packages/
  shared-types/        # canonical transaction ledger + instrument models (single source of truth)
  ui/                  # shared design-system components
infra/                 # IaC, DB migrations, deployment config
docs/
  Instructions.md
  Agents.md
```

## Suggested stack (from PRD's technical architecture section)

- **Frontend:** Next.js + TypeScript, Tailwind, responsive PWA, accessible charting (no red/green-only indicators)
- **Backend:** Node.js/TypeScript (NestJS/Fastify) for platform services; Python/FastAPI acceptable for calculation-heavy services
- **DB:** PostgreSQL, with TimescaleDB or partitioned tables for daily/intraday valuation snapshots
- **Queues:** Redis + BullMQ (or Temporal) for imports, syncs, quote refresh, report generation, alerts
- **Storage:** encrypted S3-compatible object storage for statements/reports
- **Billing:** Razorpay Orders/Subscriptions — Checkout only, never store card/UPI/bank credentials
- **Observability:** OpenTelemetry, PII-redacted structured logs

## Canonical transaction ledger (do not diverge from this shape)

Every ingested record — regardless of source — normalizes into one immutable ledger row:

```
transaction_id, portfolio_id, account_id, source_id, source_transaction_id
occurred_at, settled_at, imported_at, timezone
event_type: buy | sell | dividend | interest | fee | transfer_in | transfer_out
            | split | merger | spin_off | airdrop | staking_reward
            | withholding_tax | FX_conversion
instrument_id, quantity, unit_price, gross_amount, fee_amount, tax_amount, currency
fx_rate_to_base, source_document_ref, parse_confidence, reconciliation_state
encrypted raw source payload reference (traceability)
```

Money/quantity fields are always decimal-safe types (never native floats). Dates always carry an explicit timezone.

## Money math reference

- **P&L** = Current Value + Realized Proceeds + Income − Net Contributions − Fees − Taxes
- **XIRR**: solve `Σ CFₖ / (1+r)^((dₖ−d₀)/365) = 0` for `r`, signed cash flows; surface an explicit "unavailable" state rather than guessing when the cash-flow pattern can't converge.
- **Allocation drift** = Actual Weight − Target Weight, per category.
- **Sharpe** = mean(Rp − Rf) / stdev(Rp − Rf) × √(annualisation factor).
- Full formula set lives in the PRD Appendix — treat it as the spec, not this summary.

## Where to go next

- Build order, environment setup, testing bar, and security checklist → `docs/Instructions.md`
- Splitting work across multiple agents/sessions and escalation rules → `docs/Agents.md`
