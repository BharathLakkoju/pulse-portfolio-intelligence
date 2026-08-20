# Instructions.md — Development Playbook

Read `CLAUDE.md` first for product context and hard constraints. This file is the "how to actually build it, in what order, to what bar" reference.

## 1. Build order (mirrors PRD Release Plan — don't skip ahead)

**R0 — Validation Prototype**
Manual holdings/transaction entry → generic CSV import → daily price refresh → value/invested/P&L/XIRR/allocation → target allocation + drift indicator → weekly email digest → CSV/PDF export → analytics events wired.

**R1 — India MVP**
Broker connection framework (pick first connector by verified commercial terms, not convenience) → CAS/statement upload + CSV workflows → Indian equities/ETFs/MF/cash/manual/FD/crypto → daily portfolio history → XIRR/CAGR/TWRR + realized/unrealized P&L → allocation breakdowns → dividend/income calendar → basic risk dashboard (concentration, diversification, drift, drawdown) → alerts (drift, price, dividend, stale sync, missing cost basis) → India capital-gains estimate + CA-ready export → PWA → Razorpay billing.

**R2 — Paid Intelligence**
Multi-source connections → advanced risk (Sharpe, Sortino, beta, VaR, correlation, stress tests) → rebalancing workspace (proposal only, no execution) → advanced tax-lot reports → custom alert rules + scheduled reports → household/family view → grounded AI portfolio explainer.

**R3 — International Expansion**
Multi-currency valuation + historical FX → Interactive Brokers integration → regional aggregation provider (commercial validation first) → global identifiers/exchange mappings → jurisdiction-specific export workflows → localisation/consent/payment support.

Do not build R2/R3 surface area before the corresponding R-earlier data model exists (e.g. don't build the correlation matrix before the price-history and instrument-master pipeline is solid — it will just produce numbers no one can trust).

## 2. Environment setup

Minimum local services: PostgreSQL (with TimescaleDB extension or a partitioning strategy), Redis, an S3-compatible bucket (e.g. MinIO locally), and a queue worker process.

Expected environment variables (names are a convention, adjust to actual framework):

```
DATABASE_URL=
REDIS_URL=
OBJECT_STORAGE_ENDPOINT= / OBJECT_STORAGE_BUCKET= / OBJECT_STORAGE_KEY= / OBJECT_STORAGE_SECRET=
KMS_ENCRYPTION_KEY_ID=          # field-level encryption for tokens/PII
JWT_SECRET= / SESSION_SECRET=
RAZORPAY_KEY_ID= / RAZORPAY_KEY_SECRET= / RAZORPAY_WEBHOOK_SECRET=
MARKET_DATA_API_KEY=            # confirm commercial display/redistribution rights before using in prod
FX_DATA_API_KEY=
CRYPTO_INDEXER_API_KEY=
BASE_CURRENCY_DEFAULT=INR
```

Never commit real values. Local `.env.example` should list every key with a placeholder and a one-line comment on where it's used.

## 3. Coding standards

- TypeScript strict mode everywhere; no `any` without a comment explaining why.
- Money and quantity fields use a decimal-safe type (e.g. `decimal.js`, database `numeric`) — never native floats for anything that touches valuation, P&L, or tax.
- All timestamps stored in UTC with an explicit source timezone field alongside, per the ledger schema in `CLAUDE.md`.
- API errors follow a consistent problem-detail shape (type, title, status, detail, instance) — no bare stack traces to the client.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
- Every PR description states: what changed, which PRD acceptance criterion it satisfies, and how it was tested.

## 4. Testing bar (non-negotiable for these areas)

- **Calculation engine** (XIRR, TWRR, CAGR, drift, Sharpe/Sortino, VaR): golden-value unit tests against hand-verified cases, plus property-based tests for edge cases (single cash flow, all-negative flows, zero-value periods). No calculation ships without a test that pins its expected output.
- **Tax logic**: test fixtures should be checked against real CA-reviewed examples where possible; any PR touching tax code gets a `tax-logic-review` label and is treated as high-risk.
- **Ingestion/connectors**: idempotency tests — replaying the same statement/API response must not create duplicate ledger rows (test the dedupe hash, not just "it ran twice").
- **Webhook handlers** (Razorpay): signature-verification tests and duplicate-delivery idempotency tests are mandatory before merge.
- **Reconciliation**: tests for the low-confidence-parse queue and balance-mismatch flagging path, not just the happy path.

## 5. Definition of done for any user-visible metric

Before a metric ships, confirm the UI/API response can show, on demand:

- [ ] Formula or calculation method used
- [ ] Date range covered
- [ ] Base currency and FX conversion approach
- [ ] Benchmark used, if applicable
- [ ] Risk-free-rate assumption, if applicable
- [ ] Annualisation method
- [ ] Which accounts/assets were included vs excluded
- [ ] Data coverage and any quality warnings (stale price, missing cost basis, etc.)

If any of these can't be answered, the metric isn't done — ship a labeled "unavailable" state instead of a silently wrong number.

## 6. Security checklist (apply to every PR touching auth, connectors, or billing)

- [ ] TLS in transit; encryption at rest via managed KMS; field-level encryption for tokens/sensitive identifiers
- [ ] OAuth preferred over credential storage; read-only scopes only, shown to the user before consent
- [ ] No seed phrases/private keys requested or stored, ever
- [ ] No card/UPI/bank credentials touch our servers — Razorpay Checkout/hosted flow only
- [ ] Secrets never appear in logs, analytics payloads, browser bundles, or support-tool exports
- [ ] Entitlements enforced server-side, never trusted from client state
- [ ] Audit trail entry written for sign-in, export, connection change, admin access, billing event, and deletion

## 7. Compliance guardrails

- No advice-shaped language anywhere user-facing: reviewers should grep for phrases like "you should invest", "we recommend buying/selling", "guaranteed return" before merging copy changes.
- The AI portfolio explainer must ground every answer only in the user's authorised data plus vetted educational content, must cite data timestamp/scope/assumptions, and must refuse disallowed tasks (personalised buy/sell/hold calls, "what should I invest in", price predictions, order execution) — see PRD "AI Portfolio Explainer" section for the exact allow/deny list.
- Anything that starts to look like personalised advice gets stopped and routed to legal/SEBI review, not shipped behind a feature flag "for now."

## 8. When the PRD is ambiguous

Priority order for tie-breaking implementation decisions:

1. Read-only access and user consent
2. Data accuracy / reproducibility
3. Explainability (can we show our work?)
4. Feature breadth

The "Non-Goals for MVP" list in the PRD is binding — treat it as a blocklist, not a backlog.
