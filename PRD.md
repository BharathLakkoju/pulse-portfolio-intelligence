# Pulse: Your Portfolio Intelligence — Product Requirements Document

**Version:** 1.0  
**Status:** MVP planning  
**Product name:** **Pulse: Your Portfolio Intelligence**  
**Primary launch market:** India  
**Expansion markets:** Global / NRI investors  
**Payment provider:** Razorpay for Indian and eligible international payments

---

## Product Summary

**Pulse: Your Portfolio Intelligence** is a privacy-first, read-only portfolio tracking and analytics platform for retail investors. It consolidates investments spread across brokers, mutual funds, crypto exchanges, wallets, and manually added assets, then explains portfolio performance, allocation, risk, tax exposure, and events requiring attention.

Pulse will begin as a tracking, reporting, and educational analytics tool—not a trading platform, custodian, or personalised investment adviser. Portfolio trackers create meaningful value when they combine cross-account coverage, trustworthy performance measurement, portfolio analysis, income tracking, and tax/reporting workflows rather than simply displaying live prices. [web:102][web:203]

### Product promise

> **Know the pulse of your money: what you own, how it performs, where the risk is, and what deserves attention.**

---

## Problem Statement

Retail investors often own Indian equities, ETFs, mutual funds, US stocks, crypto, cash, and other assets through several brokers and accounts. Each platform shows only its own data, uses differing P&L calculations, and rarely shows total allocation, cross-asset risk, cash-flow-adjusted returns, or tax-ready transaction history.

As a result, users maintain spreadsheets, miss concentration and allocation drift, struggle to compare performance against a benchmark, and spend significant time compiling data for review or tax filing. A useful portfolio dashboard should answer decision-focused questions rather than merely present a large collection of charts. [web:210]

---

## Vision

Build the most trusted India-first, global-ready portfolio intelligence layer for individual investors—one that works across platforms without taking custody of money or pushing users to trade.

### Long-term vision

Pulse becomes the personal financial operating system where users can:

- View all investable assets and liabilities in one base currency
- Understand actual return after contributions, fees, FX, and tax events
- Identify concentration, correlation, drawdown, and allocation drift early
- Prepare clean records for CAs/tax professionals
- Monitor goals, dividends, SIPs, maturities, and portfolio health
- Ask grounded questions about their own portfolio in plain English

---

## Goals

1. Deliver a reliable unified portfolio view across Indian and global investment accounts.
2. Minimise onboarding effort through APIs, statements, CSV imports, public wallet addresses, and manual entry.
3. Compute transparent, cash-flow-aware performance metrics including invested amount, realized/unrealized P&L, XIRR, CAGR, and benchmark-relative return.
4. Convert risk analytics into understandable and actionable portfolio insights.
5. Create recurring value that supports a subscription through automation, reporting, alerts, tax workflows, and advanced intelligence.
6. Keep all data connections read-only and give users clear consent/revocation controls.
7. Design canonical asset, transaction, pricing, currency, and tax-lot models that support international expansion.

## Non-Goals for MVP

- Placing, modifying, or executing trades
- Holding user funds, managing custody, lending, or offering a wallet
- Guaranteed returns, stock tips, price predictions, or personalised buy/sell instructions
- Automated rebalancing execution
- Full multi-country tax filing
- Every broker integration at launch; trusted coverage beats fragile breadth

---

## Target Users

| Persona | Primary need | Pain point | Reason to pay |
|---|---|---|---|
| Indian long-term investor | Track stocks, ETFs, mutual funds, gold, and cash | Investments are split across platforms | Consolidated XIRR, allocation health, reports, tax exports |
| Active trader | Monitor positions, realized P&L, and exposure | Broker dashboards are siloed | P&L breakdown, alerts, journal, risk metrics |
| Crypto investor | Track CEX, wallets, staking, and traditional assets | Cost basis and wallet data are fragmented | Read-only sync, wallet tracking, tax transactions |
| NRI/global investor | See India + US/global investments in one place | Multiple currencies and brokers | FX-adjusted performance and global account support |
| Tax-conscious investor | Prepare accurate transaction records | Manual reconciliation for capital gains | Tax-lot engine, CA-ready reports, source-document linking |
| Advisor/CA, later | Review several client portfolios | Spreadsheet cleanup and missing records | Multi-client workspace, exports, audit trail |

### Initial Ideal Customer Profile

A digitally literate Indian investor with at least ₹5 lakh invested, holdings across two or more platforms, and a clear need for consolidated performance tracking, risk visibility, or tax preparation.

---

## Positioning

### Positioning statement

For investors whose wealth is spread across brokerages and asset classes, **Pulse: Your Portfolio Intelligence** provides a complete, private, and explainable view of portfolio performance, risk, and tax records—without taking custody of funds or requiring users to change brokers.

### Differentiators

- **India-native:** Indian equities, ETFs, mutual fund statements, INR formats, local benchmarks, and India tax workflow.
- **Global-ready:** multi-currency accounting, foreign holdings, global brokers, and crypto assets.
- **Explainable:** every important metric links to its holdings, transactions, inputs, source, and timestamp.
- **Privacy-first:** read-only permissions, encrypted tokens, no trading scopes, no private crypto keys.
- **Decision-oriented:** alerts focus on allocation drift, concentration, tax readiness, stale data, and portfolio impact—not price-noise alone.

---

## Success Metrics

### North-star metric

**Weekly Active Funded Portfolios (WAFP):** number of users who have connected/imported at least one investment source and interact with a portfolio insight, report, alert, or analysis during a seven-day period.

### Activation

- Signup-to-first-funded-portfolio rate
- Median time to first portfolio view; target: under 10 minutes through supported connection, under 20 minutes through statement import
- Percentage of new users with two or more sources within 7 days
- Data-completeness score after onboarding

### Retention

- Day 7, Day 30, Day 90 funded-portfolio retention
- WAU/MAU
- Monthly report-generation rate
- Weekly insight/alert open rate
- Percentage of users with at least one configured target allocation or goal

### Monetization

- Free-to-trial conversion
- Trial-to-paid conversion
- MRR, ARR, ARPU, annual-plan adoption
- Paid feature adoption: tax exports, advanced risk analytics, multiple connections, scheduled reports
- Churn, refund rate, failed-payment recovery rate

### Trust and reliability

- Connector sync-success rate
- Data freshness SLA compliance
- Statement parsing confidence and reconciliation mismatch rate
- Critical security incidents: target zero
- Support contacts per 100 connected accounts

---

## Product Principles

1. **Accuracy before polish:** numbers must be reproducible, labelled, and traceable.
2. **Read-only by default:** Pulse never needs trading, transfer, or withdrawal permission for tracking.
3. **Explain, don’t merely score:** every risk/health score must reveal its inputs and thresholds.
4. **Progressive complexity:** simple portfolio health first, deep analytics on demand.
5. **Privacy earns retention:** no sale of portfolio data; clear control, consent, export, and deletion.
6. **Local truth:** currencies, benchmarks, tax rules, dates, and classifications must be region-aware.

---

## Release Plan

## Release 0 — Validation Prototype

**Goal:** validate core UX, calculations, and willingness to pay with 20–50 design partners.

- Manual holdings and transaction entry
- Generic CSV transaction import
- Daily price refresh
- Total value, invested amount, P&L, XIRR, allocation, top holdings
- Target allocation and allocation-drift indicator
- Weekly portfolio email digest
- CSV/PDF export
- Product analytics and structured feedback capture

## Release 1 — India MVP

**Goal:** launch a credible paid tracking product for Indian investors.

- Broker connection framework; prioritise first read-only broker connector after commercial/API validation
- CAS/statement upload and CSV import workflows
- Indian equities, ETFs, mutual funds, cash, manual assets, fixed deposits, and crypto support
- Daily portfolio history and performance timeline
- XIRR, CAGR, TWRR where data coverage permits, realized/unrealized P&L
- Allocation by asset class, sector, market-cap, geography, currency, broker
- Dividend/income calendar
- Basic risk dashboard: concentration, diversification, allocation drift, drawdown
- Alerts: drift, price movement, dividends, stale sync, missing cost basis
- India capital-gains estimate and CA-ready data exports, with transparent assumptions
- Responsive web app/PWA
- Razorpay billing for INR subscriptions and eligible international payments

## Release 2 — Paid Intelligence

**Goal:** create durable upgrade and renewal value.

- Multiple broker, exchange, wallet, and statement sources
- Advanced risk metrics: Sharpe, Sortino, beta, VaR, correlation, stress tests
- Rebalancing workspace with proposed allocation changes; no execution
- Advanced tax-lot calculations and reports
- Custom alert rules and scheduled reports
- Household/family portfolio view and secure sharing
- Grounded AI portfolio explainer

## Release 3 — International Expansion

**Goal:** support NRI and international investors safely.

- Multi-currency valuation and historical FX conversion
- Interactive Brokers integration
- Regional brokerage aggregation provider where commercially available
- Global securities identifiers and exchange mappings
- Jurisdiction-specific export workflows before country-specific tax calculations
- International localisations, consent, privacy, and payment support

Commercial aggregation availability and pricing vary by country and provider, so Pulse must treat third-party connection costs as unit economics rather than assuming global account sync is free. [web:216][web:221][web:229]

---

## Functional Requirements

## Identity and Onboarding

### Requirements

- Passwordless sign-in plus Google/Apple authentication where available
- MFA using passkeys/authenticator app; email OTP fallback
- Onboarding fields: country, tax residency, base currency, language, investor profile, experience, goals
- User-selectable profile: investor, trader, crypto, NRI/global, advisor/CA
- Guided connection/import flow: connect account, upload statement, import CSV, add manually
- Progress checklist showing data-completeness status
- Demo/sample portfolio isolated from real portfolio data
- Account export, account deletion, consent withdrawal, and session/device management

### Acceptance criteria

- User can add a manual holding in under three minutes.
- Every connection clearly displays its requested data scope and read-only status before authorization.
- User can revoke a connection without contacting support.

---

## Portfolio Data Ingestion

### Supported input methods

| Method | Release | Requirements |
|---|---|---|
| Broker OAuth/API | R1, selective | Read-only scope, encrypted tokens, incremental sync, reconnect flow |
| Statement/CAS upload | R1 | PDF/CSV upload, parser confidence, user review, raw document retention controls |
| Broker CSV import | R0/R1 | Provider templates, generic schema, validation, downloadable error report |
| Manual holdings | R0 | Quantity, cost basis, purchase date, currency, asset type |
| Manual transactions | R0 | Buy, sell, dividend, fee, transfer, split, interest, tax, FX event |
| Crypto exchange API | R1/R2 | Read-only API keys only, permission guidance, revocation support |
| Public wallet address | R2 | Public-address tracking only; never request private keys or seed phrases |
| International aggregation | R3 | Consent-led provider, region-specific terms and data controls |

### Canonical transaction ledger

All data must normalize to an immutable transaction ledger:

- `transaction_id`, `portfolio_id`, `account_id`, `source_id`, `source_transaction_id`
- `occurred_at`, `settled_at`, `imported_at`, `timezone`
- `event_type`: buy, sell, dividend, interest, fee, transfer_in, transfer_out, split, merger, spin_off, airdrop, staking_reward, withholding_tax, FX_conversion
- `instrument_id`, `quantity`, `unit_price`, `gross_amount`, `fee_amount`, `tax_amount`, `currency`
- `fx_rate_to_base`, `source_document_ref`, `parse_confidence`, `reconciliation_state`
- encrypted raw source payload reference for traceability

### Data-quality requirements

- Imported records are never silently overwritten.
- Deduplicate using provider IDs; fallback to deterministic transaction hashing.
- Flag missing cost basis, date, price, currency, quantity, or unmatched sale lots.
- Provide reconciliation queue for low-confidence parsing and balance mismatch.
- Label values as live, delayed, end-of-day, stale, or unavailable.

---

## Instrument, Market Data, and FX

### Requirements

- Canonical instrument master with ISIN, ticker, exchange, currency, asset class, country, sector, and listing mappings
- Symbol aliases and exchange-specific identifiers; ticker alone is insufficient
- Quote source, timestamp, delay, currency, and market status shown with price data
- Historical adjusted prices for performance analytics
- Corporate actions: splits, bonuses, dividends, mergers, symbol changes, delistings
- Historical FX rate storage and conversion into base currency
- Safe handling of weekends, holidays, suspended securities, unpriced/manual assets, and stale quotes

### Commercial requirement

Before production launch, confirm each provider’s commercial rights for display, caching, storage, and redistribution. Exchange market data can require separate licensing even where individual investors can view it in their broker application.

---

## Portfolio Dashboard

The dashboard must answer four questions: **What do I own? How am I performing? What risks am I taking? What should I review?** This follows the principle that dashboards should promote decisions, not just display metrics. [web:210]

### Required widgets

- Net worth and investment portfolio value
- Today’s P&L, total P&L, realized and unrealized P&L
- Invested amount, net contributions, withdrawals, current value
- Return-period selector: 1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y, all time, custom
- Return-method label: simple return, XIRR, TWRR, CAGR, or unavailable
- Allocation and target-vs-actual chart
- Top gainers/losers and contribution to returns
- Largest exposures by security, asset class, sector, geography, broker, currency
- Portfolio health cards: concentration, diversification, drift, data completeness, tax readiness
- Upcoming dividends, SIPs, maturity events, and corporate actions
- Insight feed with evidence and drill-down links

### Customisation

- Reorder, hide, and restore widgets
- Named dashboards: Long-Term, Trading, Crypto, Family, Tax
- Saved filters, benchmarks, date ranges
- Accessible gain/loss indicators that do not rely solely on red/green colour

---

## Holdings and Transaction Views

### Holdings table

- Instrument, quantity, average cost, price, invested value, current value, realized/unrealized P&L, return %, portfolio weight, price freshness
- Sort, filter, search, group, tag, and export
- Grouping by account, broker, asset class, sector, geography, currency, and custom tag
- Missing-cost-basis and stale-price flags

### Instrument detail

- Price chart with buy/sell markers
- Position and tax-lot view
- Contribution to portfolio return/risk
- Corporate actions, dividend history, notes, source documents, and relevant alerts

### Transaction ledger

- Unified timeline for all sources
- Filters, search, export, duplicate resolution, and source-document links
- Manual corrections create immutable adjustment/audit records

---

## Performance Analytics

### Calculations

- Current value, invested value, net cash flow
- Absolute and percentage P&L
- Realized versus unrealized gains/losses
- XIRR / money-weighted return
- TWRR where sufficient periodic data exists
- CAGR for eligible periods
- Dividend and interest income, yield on cost, trailing yield
- Benchmark-relative and active return
- Contribution to return by holding, asset class, sector, currency, and account
- Rolling and calendar-year returns

Benchmark comparison is necessary because an absolute return does not reveal whether a portfolio outperformed an appropriate reference market. [web:206]

### Transparency requirements

Each metric must show:

- Formula/calculation method
- Date range
- Base currency and FX approach
- Benchmark, where applicable
- Risk-free-rate assumption, where applicable
- Annualisation method
- Included/excluded accounts and unpriced assets
- Data coverage and quality warnings

### Benchmarks

Provide region-appropriate choices, including NIFTY 50, NIFTY 500, Sensex, S&P 500, MSCI World, Bitcoin, and custom blended benchmarks.

---

## Risk and Diversification

Users should not be overwhelmed with advanced statistics. Prioritise a small, explainable set of metrics and let interested users drill down; consistently reviewed drawdown, rolling return, a risk-adjusted metric, and CAGR are more useful than an overloaded screen. [web:208]

| Metric | Purpose | Availability |
|---|---|---|
| Concentration | Top holdings / HHI concentration | Free |
| Allocation drift | Actual allocation vs target allocation | Free limited, Pro full |
| Diversification score | Spread across assets, sectors, geographies | Free summary |
| Volatility | Variation in portfolio returns | Pro |
| Maximum drawdown | Largest historical peak-to-trough decline | Pro |
| Sharpe/Sortino | Risk-adjusted return | Pro |
| Beta | Sensitivity to selected benchmark | Pro |
| Correlation matrix | Relationship among holdings/categories | Pro |
| Historical VaR | Historical loss threshold estimate | Pro |
| Scenario/stress analysis | Sensitivity to market/FX/rate movements | Premium |

### UX safeguards

- Define all risk labels and thresholds.
- Clearly state risk metrics use historical data and do not predict future returns.
- Display calculation coverage, e.g. number of observations and portfolio percentage priced.
- Make user-set drift thresholds editable; present them as reminders, not investment advice.

---

## Goals and Rebalancing

Goal-based tracking can improve long-term engagement by helping users relate investments and recurring contributions to specific future outcomes. [web:233]

### Goals

- Goal type: emergency fund, home, education, retirement, travel, custom
- Target amount, date, contribution amount/frequency, expected-return range, inflation assumption
- Link goals to portfolios/accounts
- On-track, behind, ahead status shown as scenarios, not promises
- SIP/DCA schedule tracking and reminders

### Rebalancing workspace

- User defines target allocations by asset class/category
- Pulse calculates allocation drift and amount needed to return to target
- Contribution-first option: direct fresh cash toward underweight assets before suggesting sales
- Simulate allocation, concentration, and estimated gains impact
- Export checklist or CSV
- No order placement or trade execution in MVP
- Prominent informational-not-advice disclaimer

---

## Income and Corporate Events

- Dividend calendar: announcement, ex-date, record date, payout date, estimated/received amount, withholding tax
- Interest, bond maturity, FD maturity, recurring SIP calendar
- Corporate-action inbox: splits, bonuses, rights, mergers, symbol changes
- Income reporting by period, instrument, asset class, and country
- Alerts where corporate action needs user review or causes reconciliation discrepancy

---

## Tax Workspace

Tax reporting is a premium conversion driver only if every calculated output is transparent, transaction-level, and clearly labelled as an estimate pending professional review.

### India v1

- Holding-period classification based on configurable rules by asset type
- FIFO and configurable cost-basis methods where permitted/appropriate
- Realized gain/loss ledger by financial year
- Capital-gain classification and calculation rules represented as configuration—not hard-coded constants
- Dividend, interest, fees, taxes, and withholding summary
- Categories for equity, ETF, mutual fund, foreign asset, crypto, and cash events
- CA-ready CSV/XLSX/PDF export: transaction ledger, lots, gain summary, assumptions, unresolved exceptions
- Link source documents such as contract notes and statements

### International phase

- Country-specific modules; do not treat tax computation as one universal formula
- Export-first approach for US, UK, EU, and other tax jurisdictions
- Tax-specialist validation before releasing country-specific calculation claims
- Multi-currency gain records with disclosed FX method

---

## Alerts and Notifications

Alerts should focus on material portfolio impact, allocation drift, corporate/income events, data freshness, and risk conditions—not only individual asset price movement. [web:203][web:209]

### Channels

- In-app notification inbox
- Email
- Web/PWA push
- Native push after mobile-app release
- WhatsApp/SMS only after consent, cost, and legal review

### Alert types

- Portfolio value movement by amount or percentage
- Individual instrument movement
- Allocation drift threshold crossed
- Security, sector, or currency concentration threshold crossed
- Drawdown, volatility, or risk-score change
- Dividend, ex-date, maturity, SIP, and corporate action event
- Missing cost basis or tax data warning
- Connection expiry, sync failure, stale price, balance mismatch
- Weekly/monthly review digest

### Controls

- User-defined thresholds, frequency caps, channels, quiet hours, snooze/mute
- Digest default for low-urgency insight notifications
- Every alert explains why it fired and links to underlying data

---

## Reports and Exports

- Portfolio summary: value, allocation, P&L, return methods, benchmark, top exposure
- Performance report: XIRR/CAGR/TWRR, period performance, contribution analysis
- Risk report: concentration, diversification, drawdown, correlations, selected metrics
- Income report: dividends, interest, cash flow
- Tax report: transactions, lots, gain estimate, assumptions, reconciliation issues
- Goal progress report
- Export: CSV, XLSX, PDF, print-friendly web page, expiring secure link
- Scheduled monthly, quarterly, and financial-year reporting
- Branded advisor/CA reports in later release

---

## AI Portfolio Explainer

### Purpose

Pulse AI helps users understand their own portfolio data; it is not an investment-advice engine.

### Allowed tasks

- “Why did my portfolio change today?”
- “Which sectors exceed 20% of my portfolio?”
- “What dividends did I receive this financial year?”
- “Show what changed since last month.”
- Explain XIRR, drawdown, beta, allocation drift, or tax-lot terms
- Summarise reports and identify missing/stale data
- Create natural-language filters and draft questions for a CA or registered advisor

### Disallowed tasks without additional legal/regulatory approval

- Personalised buy/sell/hold calls
- “What should I invest in?” recommendations
- Price predictions or return guarantees
- Executing orders or changing brokerage accounts

### Guardrails

- Answers grounded only in user-authorised data and vetted educational content
- Portfolio-specific answers cite data timestamp, scope, sources, and assumptions
- Tenant isolation; no model training on customer financial data without explicit opt-in
- Prompt-injection protection and approved tool allowlist
- Financial-information disclaimer displayed when relevant

---

## Pricing and Monetization

Freemium is appropriate because free users need to experience a complete “aha” moment, while paid plans should monetize automation, breadth, advanced analysis, reports, and tax workflows. Comparable trackers commonly reserve broader connection limits, advanced analytics, and tax functionality for paid plans. [web:102][web:231][web:239]

### Plans

| Feature | Free | Pro India | Pro Global | Premium / Tax |
|---|---:|---:|---:|---:|
| Price | ₹0 | ₹499/month or ₹4,999/year | $9.99/month or $99/year | ₹999/month or ₹8,999/year; $19.99/month or $199/year |
| Accounts/portfolios | 1–2 | 10 | 10 | Unlimited reasonable-use |
| Manual/CSV imports | Yes | Yes | Yes | Yes |
| Broker/exchange connections | 1 | 5 | 5 | Unlimited reasonable-use |
| Refresh frequency | Daily/delayed | Intraday where licensed | Intraday where licensed | Intraday where licensed |
| P&L, XIRR, allocation | Yes | Yes | Yes | Yes |
| Advanced risk | Preview | Yes | Yes | Yes |
| Custom alerts | Limited | Yes | Yes | Yes |
| Benchmark/rebalancing | Basic | Yes | Yes | Yes |
| Tax workspace | No | Basic export | Basic export | Full workflow |
| AI explanation | Limited | Included | Included | Higher fair-use limit |
| Scheduled reports | No | Monthly | Monthly | Monthly/quarterly/custom |
| Support | Community/email | Priority email | Priority email | Priority support |

### Monetization rules

- Free tier provides full basic ownership visibility: portfolio value, basic P&L, allocation, and one useful insight/alert.
- Never lock a user out of historical manually entered data after downgrade.
- Gate refresh frequency, number of connections, advanced analysis, tax output, automation, and scheduled reports—not basic access to user records.
- Test monthly versus annual pricing and upgrade moments before finalising pricing.

---

## Billing and Payments

### Payment decision

Pulse will use **Razorpay** as its initial payment provider for domestic INR payments and eligible international payment collection. International method availability, supported customer regions/currencies, settlement, fees, recurring-payment capabilities, and Dynamic Currency Conversion must be confirmed through Razorpay merchant onboarding and current commercial terms. Razorpay documents international payment and local-currency display capabilities, but availability is merchant- and method-dependent. [web:107][web:112]

### Payment requirements

- India: support INR subscriptions using Razorpay-supported UPI, domestic cards, netbanking, and approved methods.
- International: offer Razorpay-supported international cards/wallets and permitted methods based on billing country and merchant approval.
- Show final currency, amount, tax, and FX/DCC disclosure before payment confirmation where relevant.
- Use Razorpay Checkout/hosted payment experience; Pulse must not store card, UPI, or bank credentials.
- Create orders/subscriptions server-side and verify Razorpay webhooks using signatures.
- Treat webhook processing as idempotent to prevent duplicate entitlements, invoices, and subscriptions.
- Handle success, pending, failed, cancelled, refund, chargeback/dispute, renewal, and expiration states.
- Offer billing portal for invoice history, GST details, renew/cancel, payment recovery, and supported payment-method updates.
- Show trial duration, renewal date, recurring price, and cancellation route clearly.
- Enforce entitlements server-side.

### Billing architecture

```text
Pulse Web/PWA
      |
      | Checkout request
      v
Pulse Billing API -----> Razorpay Orders / Subscriptions
      |                         |
      |                         | Signed payment webhook
      v                         v
Entitlement Service <--- Webhook Verification Service
      |
      v
Feature Gates + Billing Portal + Invoices + Reconciliation
```

### Required billing data

- `billing_customer_id`, `razorpay_customer_id`
- `razorpay_order_id`, `razorpay_payment_id`, `razorpay_subscription_id`
- `plan_id`, `entitlement_version`, `billing_country`, `currency`
- `amount`, `tax_amount`, DCC/FX disclosure state, invoice reference
- `payment_status`, `webhook_event_id`, `renewal_at`, `cancelled_at`

---

## Information Architecture

### Primary navigation

1. **Overview** — portfolio snapshot, insight feed, net worth
2. **Portfolio** — holdings, accounts, transactions, performance
3. **Analyze** — allocation, risk, benchmark, rebalancing
4. **Plan** — goals, SIP/DCA, income calendar
5. **Tax** — lots, capital-gain estimate, reports, exports
6. **Reports** — scheduled and generated reports
7. **Connections** — brokers, exchanges, wallets, statements, sync health
8. **Settings** — profile, currency, privacy, alerts, billing, data controls

### First-session flow

1. Explain read-only access and data privacy.
2. Collect base currency, country, and tax-residency information.
3. Present connect/import/manual options based on user profile.
4. Import/connect first source.
5. Ask user to review low-confidence parsing or missing data.
6. Encourage second source connection/import.
7. Surface first useful insight: allocation, top exposure, missing cost basis, or performance.
8. Ask for a goal or target allocation after value is demonstrated.

---

## Technical Architecture

### High-level architecture

```text
Web/PWA + Native Mobile (later)
            |
       API Gateway / BFF
            |
+--------------------- Core Platform ----------------------+
| Auth & Consent | Portfolio | Ledger | Billing | Alerts    |
| Instrument Master | Reporting | Audit | Entitlements      |
+-----------------------------------------------------------+
            |
+-------------------- Data Pipelines -----------------------+
| Broker Connectors | File Ingestion | Crypto Indexers       |
| Market Data       | FX Data        | Corporate Actions     |
+-----------------------------------------------------------+
            |
Encrypted PostgreSQL + Object Storage + Portfolio Snapshots
```

### Suggested implementation stack

- **Frontend:** Next.js/React, TypeScript, responsive PWA, typed API client, accessible charting
- **Backend:** Node.js/TypeScript with NestJS/Fastify or Python/FastAPI for calculation services
- **Database:** PostgreSQL; TimescaleDB or partitioned tables for valuations/snapshots
- **Workers/queues:** Redis + BullMQ/Temporal or managed queue for imports, syncs, quotes, reports, alerts
- **Storage:** encrypted S3-compatible object storage for statements/reports
- **Observability:** OpenTelemetry, PII-redacted structured logs, error tracking, sync health dashboards
- **Deployment:** Infrastructure as Code, separate development/staging/production, regional data placement aligned with legal requirements

### Core services

| Service | Responsibility |
|---|---|
| Auth & consent | Identity, MFA/passkeys, OAuth, consent/revocation records |
| Connector platform | Provider adapters, tokens, schedules, retries, webhooks |
| Ledger | Immutable transactions, correction records, provenance |
| Instrument master | Identifiers, classifications, symbol mapping, corporate actions |
| Pricing & FX | Quotes, history, FX, freshness, data-license controls |
| Calculation engine | Valuation, returns, lots, income, risk, benchmark, tax estimates |
| Snapshot service | Daily/intraday historical valuations |
| Notifications | Alert rules, preferences, dedupe, delivery, audit |
| Reports | PDF/XLSX/CSV exports, schedules, expiring secure links |
| Billing | Razorpay integration, invoices, subscription entitlements |
| Audit | Sensitive event and data-access history |

### Calculation pipeline

1. Ingest source data and store source-document/payload reference securely.
2. Normalize data into immutable transaction records.
3. Validate, deduplicate, classify, and create reconciliation exceptions.
4. Update positions and tax lots deterministically.
5. Fetch price/FX data and calculate valuation snapshots.
6. Calculate performance, risk, income, benchmark, and tax outputs.
7. Persist calculation version, input coverage, timestamp, and assumptions for reproducibility.

---

## Security, Privacy, and Trust

Portfolio tools that aggregate financial information must make encryption, authentication, read-only access, data transparency, and user control core capabilities—not secondary features. [web:235][web:238]

### Mandatory controls

- TLS in transit; encryption at rest using managed KMS; field-level encryption for tokens and sensitive identifiers
- OAuth whenever supported; no collection of broker passwords where a secure alternative exists
- Read-only scopes; clearly display requested permission before user consent
- Never request or store crypto seed phrases/private keys
- MFA/passkeys, session/device management, suspicious-login detection
- Tenant isolation, least-privilege RBAC, production-admin controls
- Secrets manager; no sensitive tokens in logs, analytics, browser payloads, or support exports
- Token expiry monitoring, rotation, revocation, and reauthorization flow
- Audit trails for sign-in, exports, connection changes, admin access, billing, and data deletion
- PII minimisation, consent registry, retention controls, user export/delete workflow
- Encrypted backup with restore testing
- Secure SDLC: dependency scanning, SAST/DAST, code review, pentest before public launch, vulnerability-disclosure policy
- Incident-response and customer-notification plan

### Trust UX

- Read-only badge and permission explanation for every connector
- Source/freshness timestamp displayed on portfolio values
- Connection health centre with revoke/delete controls
- Estimated versus confirmed tax data clearly distinguished
- Transparent pricing, cancellation, and trial terms

---

## Compliance and Legal Boundaries

Pulse launches as a portfolio tracking, reporting, and educational analytics product. It must avoid language or functionality that establishes a personalised advisory relationship.

In India, personalised investment advice for a fee requires appropriate SEBI investment-adviser registration; guidance for consumers also states that advisory fees require RIA registration. [web:222][web:223] Before enabling personalised allocation recommendations, securities advice, or trade recommendations, Pulse must obtain formal legal and regulatory advice and implement any required registration, supervision, suitability, disclosures, and audit controls.

### Pre-launch requirements

- Fintech legal counsel review for India; separate review before expansion to each foreign market
- Review SEBI advisory/research/PMS boundaries, broker API terms, market-data licensing, and app-store finance policies
- Terms of Service, Privacy Policy, data-processing terms, financial-information disclaimer, cookie policy, acceptable-use policy
- Consent, data-access, portability, and deletion workflows aligned with applicable privacy law
- Qualified CA/tax professional review for India tax calculation logic
- Written commercial permission for market-data display/storage/redistribution
- Clear estimate-only label for tax reports and required assumptions
- No performance guarantees or advice-oriented claims in UI, notifications, reports, or AI answers

---

## Operations and Support

### Sync reliability

- Connection health: healthy, delayed, reconnect required, partial data, failed, retired
- Scheduled sync based on provider limits and user entitlement
- Exponential backoff, idempotency, circuit breakers, dead-letter queues
- User-visible retry actions and clear remediation messages
- Admin view of sync latency, failure cause, provider rate limits, parser accuracy, reconciliation backlog

### Support tooling

- In-app help centre and guided onboarding
- Support access to masked diagnostics only; no raw secrets/tokens
- “Report a data issue” capture with calculation ID, affected account/instrument, and timestamp
- Target support response: Premium within one business day, Pro within two business days

---

## Analytics and Experimentation

### Event taxonomy

- `signup_completed`, `onboarding_step_completed`
- `connection_started`, `connection_succeeded`, `connection_failed`
- `statement_uploaded`, `parse_review_completed`
- `portfolio_viewed`, `insight_opened`, `alert_created`, `alert_opened`
- `report_generated`, `tax_export_generated`
- `paywall_viewed`, `trial_started`, `subscription_started`, `subscription_cancelled`, `payment_failed`
- `data_export_requested`, `account_deleted`, `consent_revoked`

### Experiment backlog

- Best first data source for activation: API, CAS statement, CSV, manual entry
- Strongest India upgrade message: tax readiness, portfolio health, multi-broker sync, or reports
- Best time for trial offer: first portfolio, second account, first alert, or first report
- Monthly vs annual price sensitivity
- Weekly digest content: performance-first, risk-first, income-first, tax-first

### Guardrails

- Conversion experiments must not increase cancellation, refund, support tickets, notification opt-outs, or connection errors.
- Do not use fear-based messaging during market declines.

---

## MVP Acceptance Criteria

### Portfolio

- A user can create a portfolio and import/add at least 100 transactions without duplicate events.
- Holdings, positions, and P&L are computed from immutable ledger records.
- User sees current value, invested amount, realized/unrealized P&L, XIRR, allocation, and calculation assumptions.
- Manual/imported data retains source provenance and audit history.
- Price data displays source and freshness.

### Intelligence

- User can inspect allocation by asset class and top holdings.
- User can define target allocation and receive drift notification.
- User can benchmark portfolio performance against one selected benchmark.
- User can export portfolio and transaction reports.

### Security

- Tokens are encrypted and never exposed in logs/client responses.
- User can revoke connections and request data export/deletion.
- MFA available before public launch.

### Billing

- Razorpay entitlements enforced server-side.
- Checkout, webhook verification, payment failure, cancellation, invoice, and refund workflows tested end-to-end.
- Free users can preview paid insights but retain access to their essential portfolio history.

---

## Roadmap

| Period | Theme | Deliverables |
|---|---|---|
| Q1 | Validate | Manual/CSV prototype, core calculations, 20–50 beta users, pricing interviews |
| Q2 | India MVP | CAS/statement ingestion, first broker integration, dashboard, allocation, XIRR, alerts, Razorpay billing |
| Q3 | Retention | Reports, income calendar, risk dashboard, rebalancing workspace, PWA polish |
| Q4 | Monetise depth | Tax workspace, advanced analytics, household support, AI explainer, security review |
| Q5+ | Expand | Global connector model, IBKR, international aggregation, localisations, jurisdiction modules |

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Broker API changes or unavailable access | High | Connector abstraction, CAS/CSV fallback, contractual validation, provider monitoring |
| Market-data licensing restrictions | High | Legal review, provider terms, delayed/EOD fallback, entitlement enforcement |
| Incorrect tax output | High | Tax-specialist review, transparent assumptions, transaction-level exports, estimate labels |
| Product interpreted as investment advice | High | Clear tracker posture, copy review, AI constraints, feature gating until licensed |
| Security breach/token compromise | Critical | Read-only scopes, encryption, MFA, least privilege, pentest, incident response |
| Poor parsing/data quality | Medium | Confidence scores, reconciliation queue, source retention, user corrections/audit trail |
| Free API rate limits prevent scale | Medium | Caching, batching, queues, paid provider budget linked to revenue |
| Low willingness to pay | High | Design-partner interviews, pricing tests, focus on automation/tax/time savings |
| Alert fatigue | Medium | Thresholds, digests, caps, relevance, mute controls |
| Razorpay international coverage mismatch | Medium | Confirm onboarding scope before marketing regions; keep a payment-provider abstraction |
| Global legal complexity | High | Country-by-country launch, local counsel, export-first tax strategy |

---

## Open Decisions

1. **Brand clearance:** “Pulse: Your Portfolio Intelligence” requires trademark, domain, social-handle, and app-store clearance. “Pulse” is a common word; legal counsel should assess whether the full composite mark is protectable in relevant software/financial-service classes.
2. **First broker connector:** choose based on legally verified commercial terms, coverage, reliability, user demand, and unit cost.
3. **Initial asset order:** recommended: Indian equity/ETF, mutual fund statements, manual assets, crypto; validate with beta users.
4. **Native app timing:** begin with responsive web/PWA unless user research proves mobile-only usage blocks activation.
5. **Tax MVP:** choose CA export, capital-gains estimate, or guided workflow based on willingness-to-pay research.
6. **Market-data provider:** select after commercial/right-to-display evaluation, India coverage, history quality, rate limits, and cost.
7. **Razorpay onboarding:** confirm international regions, currencies, methods, recurring-payment support, settlement, fees, reserves, FX/DCC treatment, disputes, and compliance requirements.

---

## Launch Checklist

- [ ] Trademark, domain, and app-store clearance completed for Pulse: Your Portfolio Intelligence
- [ ] Commercial/API agreements confirmed for every production connector
- [ ] Market-data display/storage/redistribution rights confirmed
- [ ] Legal review completed for product copy, terms, privacy policy, consent, disclaimers, and regional scope
- [ ] India tax logic reviewed by qualified CA/tax professional
- [ ] Threat model, penetration test, MFA, encryption, audit logging, backup restore, and incident response tested
- [ ] Razorpay account approved for intended INR and international collection flows
- [ ] Razorpay checkout, webhook signature verification, idempotency, subscription, refund, cancellation, and reconciliation tested
- [ ] GST invoices and cross-border payment treatment reviewed with CA/legal adviser
- [ ] Sync, parsing, reconciliation, monitoring, and support dashboards operational
- [ ] Beta users can complete onboarding within the target time and derive a first useful insight
- [ ] Product analytics and customer-support playbooks live
- [ ] No-trading/no-advice boundaries verified in product, reports, alerts, marketing, and AI flows

---

## Appendix: Core Formulas

Every user-visible result must show relevant assumptions, currency handling, and data coverage.

### Portfolio value

\[
V_t = \sum_{i=1}^{n} q_{i,t} \times p_{i,t} \times fx_{i,t}
\]

where \(q\) is quantity, \(p\) is price, and \(fx\) converts the asset currency to the selected base currency.

### Absolute P&L

\[
\text{P\&L} = \text{Current Value} + \text{Realized Proceeds} + \text{Income} - \text{Net Contributions} - \text{Fees} - \text{Taxes}
\]

### XIRR / money-weighted return

Solve \(r\) for:

\[
\sum_{k=1}^{m}\frac{CF_k}{(1+r)^{(d_k-d_0)/365}} = 0
\]

Use signed cash flows. Show an unavailable/error state when cash-flow patterns cannot yield a meaningful result.

### Allocation drift

\[
\text{Drift}_j = \text{Actual Weight}_j - \text{Target Weight}_j
\]

### Sharpe ratio

\[
\text{Sharpe} = \frac{\overline{R_p - R_f}}{\sigma(R_p - R_f)} \times \sqrt{A}
\]

where \(A\) is the annualisation factor for the selected return frequency.

### Historical Value at Risk

At confidence level \(c\), historical VaR is the loss at percentile \(1-c\) of observed portfolio returns. It estimates a historical distribution and is not a guaranteed loss limit.

---

## Research Basis

- Useful portfolio products emphasise multi-asset/account coverage, performance tracking, allocation/risk analysis, income, tax reporting, and privacy/security. [web:102][web:203][web:235]
- Crypto portfolio users expect exchange and wallet coverage, transaction history, tax support, and read-only data connections. [web:231][web:232][web:238]
- Goal tracking is a potential retention feature when it helps users interpret contributions and progress over time. [web:233]
- International aggregation and payment capabilities require provider-specific commercial and compliance validation; they cannot be assumed to be universally available. [web:216][web:221][web:229][web:112]
