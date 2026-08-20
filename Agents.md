# AGENTS.md

Machine-readable-ish instructions for any AI coding agent (Claude Code, Cursor, Codex, etc.) operating in this repo. Product context and hard constraints live in `CLAUDE.md`; detailed workflow lives in `Instructions.md`. This file adds: setup/test/PR conventions in the standard AGENTS.md shape, plus role boundaries for splitting work across multiple agents or sessions.

## Project overview

Pulse: Your Portfolio Intelligence — a read-only, privacy-first portfolio tracker and analytics platform (India-first, global-ready). Not a trading platform. Not an advisory service until SEBI/RIA registration exists. See `CLAUDE.md` for the full non-goals list before touching anything advice-adjacent.

## Setup commands

```bash
# install deps at repo root (adjust once package manager is chosen — pnpm recommended for monorepo)
pnpm install

# local infra
docker compose up -d postgres redis minio

# run DB migrations
pnpm --filter api migrate:dev

# start dev servers
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter workers dev
```

## Code style

- TypeScript strict, no unexplained `any`
- Decimal-safe types for all money/quantity fields — never native floats
- UTC timestamps + explicit timezone field, matching the ledger schema in `CLAUDE.md`
- Conventional Commits for messages
- Full standard: `Instructions.md` §3

## Testing instructions

```bash
pnpm test                 # unit tests
pnpm test:calc-engine     # golden-value + property-based tests for XIRR/TWRR/CAGR/risk
pnpm test:ingestion       # idempotency/dedupe tests for connectors and parsers
pnpm test:webhooks        # Razorpay signature + idempotency tests
```

A PR touching `workers/calc-engine`, tax logic, ingestion, or billing webhooks is not mergeable without the matching test suite passing and, for tax logic specifically, the `tax-logic-review` label applied. Full bar: `Instructions.md` §4.

## PR instructions

- Title format: `[area] short description` (e.g. `[calc-engine] add TWRR for partial-period portfolios`)
- Description must state: what changed, which PRD acceptance criterion it satisfies, how it was tested
- Any PR touching auth/connectors/billing must complete the security checklist in `Instructions.md` §6 before merge
- Any PR adding or changing user-facing copy, alerts, or AI-explainer prompts must pass the compliance guardrail check in `Instructions.md` §7

## Specialized agent roles

When work is split across multiple agent sessions (or human+agent pairs), keep these boundaries — they mirror the PRD's core services and prevent one agent's changes from silently breaking another domain's guarantees.

| Agent | Owns | Must never do |
|---|---|---|
| **Ledger & Ingestion** | Canonical transaction ledger, broker/CSV/statement connectors, crypto indexers, dedupe & reconciliation | Mutate historical ledger rows in place; silently drop low-confidence parses instead of queuing them |
| **Calculation Engine** | Valuation, XIRR/TWRR/CAGR, risk metrics, tax-lot engine | Ship a number without its formula/assumptions payload; touch UI code |
| **Market Data & FX** | Instrument master, pricing/FX ingestion, corporate actions, live/delayed/EOD/stale labeling | Use unlicensed market data in a production path without a confirmed commercial agreement |
| **Billing & Entitlements** | Razorpay integration, webhook verification, entitlement service | Let client-side state gate a paid feature; touch portfolio calculation logic |
| **Risk & Compliance Reviewer** | Review of all user-facing copy, alerts, reports, and AI-explainer prompts for advice-shaped language | Approve personalised buy/sell/hold language, price predictions, or return guarantees |
| **Frontend/Dashboard** | Next.js UI, widgets, named dashboards, accessible (non-color-only) gain/loss indicators | Hardcode a calculation client-side that should come from the calc engine |
| **Security** | Auth/MFA, token encryption, RBAC, audit logging | Approve storage of seed phrases, private keys, or raw card/bank credentials |

## Escalation rules

- Any change to tax-calculation logic ships with a note "CA review pending" until a qualified tax professional has validated it — do not remove that note without an actual review record.
- Any change that would enable personalised recommendations (vs. generic education) is blocked and routed to legal/SEBI review per the PRD's compliance section — this applies even to "just a suggestion" copy tweaks.
- Open questions or assumptions an agent had to make while implementing something ambiguous get logged against the PRD's "Open Decisions" list, not buried in a commit message.
