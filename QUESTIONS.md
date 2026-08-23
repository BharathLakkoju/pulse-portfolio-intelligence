# Open Questions, Assumptions & Suggestions

This file logs every assumption, scope deviation, and open decision made while
building Pulse end-to-end without stopping to ask, per `Agents.md`: *"Open
questions or assumptions an agent had to make while implementing something
ambiguous get logged against the PRD's Open Decisions list, not buried in a
commit message."*

Nothing here is a silent shortcut — every deviation is labeled in the product
UI itself (banners, "DEMO DATA" tags, disclaimers) so the running app never
implies it is production-ready or that its numbers are real market data.

**Read this before demoing or extending the app.** Items marked 🔴 are hard
blockers for any real launch (need legal/compliance/commercial sign-off per
`CLAUDE.md`'s Hard Non-Goals and the PRD's Launch Checklist). Items marked 🟡
are engineering scope calls made to ship a coherent, runnable full-stack app
in one sitting instead of a partial multi-service system nobody could start.

---

## Scope philosophy

The PRD spans four release phases (R0 → R3) and explicitly gates several of
its own features behind things a coding agent cannot obtain: broker
commercial API terms, market-data redistribution licenses, SEBI/RIA
registration, CA tax review, and a live Razorpay merchant account. Building
"through the last phase" literally would mean either (a) stopping to ask for
credentials/legal sign-off repeatedly, which the task explicitly forbade, or
(b) faking those integrations in a way that could be mistaken for the real
thing.

Resolution: **every feature in the PRD has a working UI and a working code
path**, wired to a real (if synthetic/local) data layer, so the product can be
demoed screen-by-screen exactly as specced. Anywhere the PRD requires a
third-party contract, license, or registration Pulse does not have, that
screen is fully built but clearly labeled DEMO/SIMULATED and the real
integration point is isolated behind one adapter interface so swapping in the
genuine provider later is a config change, not a rewrite.

---

## Numbered decisions

1. 🟡 **Single Next.js app instead of separate `apps/web` + `apps/api` +
   `workers/*` services.** `CLAUDE.md`'s suggested layout has a distinct
   NestJS/FastAPI backend and separate queue-driven worker processes. Running
   that for real requires Postgres + Redis + MinIO all up via Docker before
   anyone can see a screen. Instead, Next.js App Router route handlers serve
   as the BFF + core platform (same responsibility split, same module
   boundaries, just co-located), and the calc-engine/ledger/pricing logic
   still lives in isolated packages (`packages/calc-engine`,
   `packages/shared-types`) so extracting them into real services later is
   mechanical. "Workers" (snapshot recompute, alert evaluation) run as
   on-demand server functions today instead of BullMQ jobs; the queue
   boundary is a single `lib/jobs.ts` call site, documented inline, so
   swapping in real BullMQ+Redis later touches one file.

2. 🟡 **SQLite (via Prisma) instead of Postgres/TimescaleDB.** Same
   reasoning — zero required external services to run `pnpm dev`. The ledger
   schema shape in Prisma matches `CLAUDE.md`'s canonical ledger field-for-
   field, and money/quantity columns are stored as `String` (decimal text)
   and only ever parsed through `decimal.js` in application code, never
   native floats or SQL arithmetic, per the CLAUDE.md decimal-safety rule.
   Migrating to Postgres is a `DATABASE_URL` + `provider` change; no schema
   redesign needed. Daily valuation snapshots use a plain indexed table
   instead of TimescaleDB hypertables — fine at demo scale, would need
   revisiting for production time-series volume.

3. 🔴 **No real broker/exchange OAuth connectors.** The PRD requires picking
   the first connector "based on legally verified commercial terms" — that
   verification can't happen inside a coding session. The Connections
   framework (scopes screen, read-only badge, consent record, health states,
   revoke flow, reconnect flow) is fully built and functional, wired to one
   **Demo Broker** and one **Demo Crypto Exchange** adapter that generate
   believable sample transactions through the exact same ingestion pipeline
   real connectors would use. The adapter interface
   (`lib/connectors/types.ts`) is the seam a real Zerodha/Upstox/CCXT
   integration would implement. Every demo connection is labeled "DEMO
   CONNECTION — simulated data" in the UI.

4. 🔴 **No licensed market data or FX feed.** PRD's "Commercial requirement"
   section is explicit: confirm redistribution rights before using real
   market data in a production path. Rather than quietly pull free-tier data
   that might violate that, the instrument master ships with ~40 seeded
   instruments (NSE large-caps, a few mutual funds, US ADRs, BTC/ETH) and a
   deterministic seeded-random daily price series per instrument, and FX
   rates likewise synthetic. Every price/FX value in the UI carries a
   "Simulated pricing — not live market data" badge and `source: "synthetic"`
   in its API payload, satisfying the PRD's live/delayed/EOD/stale/
   unavailable labeling requirement with an honest fifth label.

5. 🔴 **No statement/CAS PDF parser.** Parsing brokerage/CAS PDFs accurately
   is its own product (layout-fragile, India-specific, needs real sample
   documents and reconciliation tuning). Upload UI and storage exist (file
   lands in local `.uploads/`, a `DocumentUpload` row is created), but every
   upload is deterministically routed to `reconciliation_state: needs_review`
   with `parse_confidence: 0` and surfaced in the reconciliation queue rather
   than fabricating parsed transactions from a PDF nobody actually parsed.
   Generic CSV import (PRD's R0/R1 requirement) is fully implemented and is
   the real ingestion path used by the seed data and demo walkthrough.

6. 🔴 **Razorpay runs in local simulation, not live mode.** No merchant
   account/keys exist in this environment. `RAZORPAY_KEY_ID` etc. are empty
   in `.env.example`; when unset, the billing module runs a same-shaped
   local state machine (order → "payment" → webhook-equivalent handler →
   entitlement write) behind an identical server-side interface
   (`lib/billing/provider.ts`), so swapping in the real Razorpay SDK is
   implementing one adapter, not restructuring billing. Every checkout
   screen is bannered "TEST MODE — no real payment provider connected. No
   card data is collected." Entitlements are still enforced **server-side**
   in every gated API route, per the security checklist — the simulation
   only replaces the payment rail, not the enforcement boundary.

7. 🔴 **No passkeys/OAuth/real email delivery.** Passwordless sign-in is
   implemented as a real magic-link flow *mechanically* (token, expiry,
   single-use, session issuance) but the "email" is rendered to an in-app
   "Dev Inbox" screen instead of actually being sent, since there's no SMTP
   provider configured. Google/Apple auth, WebAuthn passkeys, and TOTP MFA
   are stubbed as disabled settings-page toggles with an explanatory tooltip
   rather than faked, since a fake "MFA enabled ✅" would misrepresent
   security posture. `Instructions.md` requires MFA before public launch —
   this is tracked as an unresolved Security Reviewer item, not silently
   marked done.

8. 🔴 **India tax-workspace numbers are estimate-only and explicitly
   unreviewed.** Every tax screen and export carries a persistent "CA review
   pending" banner per `Agents.md`'s escalation rule, and that banner is
   wired to an actual `taxLogicReviewed: false` flag rather than being static
   copy, so it can't be silently removed without a real review record later.
   Holding-period/cost-basis rules are implemented as configurable rule
   objects (not hardcoded constants) per `CLAUDE.md` principle 4, using
   FIFO and the current (AY2025-26-ish) equity/debt/crypto holding-period
   thresholds as the *default config* — treat these as a starting point for
   CA validation, not verified law.

9. 🟡 **Encryption/KMS/audit are "real shape, local implementation."**
   Field-level encryption for connector tokens uses a local AES-256-GCM
   helper keyed by `KMS_ENCRYPTION_KEY_ID` (or an auto-generated dev key) —
   correctly encrypts-at-rest in the SQLite file, but isn't a managed KMS
   with rotation/HSM backing. Audit log (sign-in, export, connection change,
   admin access, billing event, deletion) is a real DB table written on
   every relevant action, viewable in Settings → Privacy. TLS is a
   deployment concern (out of scope for `next dev`); prod deployment behind
   HTTPS is a launch-checklist item, not something a local dev server
   provides.

10. 🔴 **AI Portfolio Explainer is rule-based, not an LLM.** No LLM API key
    is configured, and wiring one up brings in prompt-injection surface that
    the PRD explicitly requires guardrails for before shipping
    (`Instructions.md` §7). Instead, the explainer answers the PRD's exact
    allowed-question set (today's movers, sector concentration, dividends
    this FY, what changed since last month, term definitions, missing/stale
    data summary) by running real queries against the user's own computed
    data and filling a template — genuinely grounded, zero hallucination
    risk, but not a general natural-language interface. Disallowed intents
    (buy/sell/hold asks, "what should I invest in", price predictions) are
    keyword-detected and answered with a fixed refusal + disclaimer. A real
    LLM integration point is isolated in `lib/ai/explainer.ts` for later.

11. 🟡 **R3 (international expansion) is a config scaffold, not a built
    feature.** Currency/benchmark/tax-classification are already
    region-aware config per `CLAUDE.md` principle 4 (see
    `packages/shared-types/src/region-config.ts`), and the base-currency /
    country / tax-residency fields exist end-to-end. Interactive Brokers,
    regional aggregators, and country-specific tax modules are not built —
    the PRD itself gates these behind "commercial validation" and
    country-by-country legal review that can't happen here. This matches
    the PRD's own instruction not to build R2/R3 surface area before the
    R-earlier data model is solid.

12. 🟡 **Single demo tenant, not a public multi-tenant signup flow.** The app
    seeds one demo user (`demo@pulse.app`) with two portfolios (a
    long-term Indian equity/MF/crypto portfolio and a small trading
    portfolio) so every screen has real, internally-consistent data to show
    on first run. Magic-link sign-in works for any email and creates a new
    empty tenant — multi-tenant isolation (each user only ever queries rows
    scoped to their own `userId`) is enforced in every query, but there's no
    admin console, invite system, or household/family sharing UI beyond the
    single-user MVP surface (household view is R2 and out of scope for this
    pass).

13. 🟡 **Corporate actions, dividend cash, and SIP scheduling are modeled
    but not synced from any live source** — they're seeded as historical
    ledger events and forward-looking calendar rows so the Income &
    Corporate Events screens have real content, consistent with #4/#5 above.

14. 🟡 **The weekly portfolio email digest (PRD R0) is a generate-on-demand
    PDF, not a scheduled email.** No SMTP/email provider and no real cron
    scheduler are wired in (see #1 and #7) — the digest content (value,
    P&L, XIRR, top movers, concentration, open insights) is real and
    correctly computed, generated from Reports → "Weekly digest". Wiring a
    scheduler to generate this automatically and an email provider to
    deliver it are the two remaining steps to make it actually weekly and
    actually emailed.

---

## Suggestions for what to tackle first after this build

- Get one real, low-friction data source working end-to-end before anything
  else: either a CAS-parsing spike (NSDL/CDSL PDF, since India equities/MFs
  are the PRD's own recommended first asset order) or one broker's read-only
  Kite Connect–style API, whichever has faster commercial approval.
- Resolve the market-data licensing question early — it blocks Analyze,
  Reports, and Tax simultaneously, and is on the PRD's own launch checklist.
- Get the India capital-gains rule config in front of a CA before anyone
  relies on the Tax workspace numbers for anything real.
- Decide the Razorpay international-coverage question (Open Decision #7 in
  the PRD) before marketing Pro Global/Premium outside India.
