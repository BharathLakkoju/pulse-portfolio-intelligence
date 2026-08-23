# Pulse: Your Portfolio Intelligence

A privacy-first, read-only portfolio tracking and analytics platform (India-first, global-ready). See `PRD.md` for the full product spec and `CLAUDE.md` / `Instructions.md` / `Agents.md` for the ground rules this build follows.

**Read `QUESTIONS.md` first.** It documents every place this build simulates something that would normally require a real commercial/legal integration (broker APIs, market-data licensing, Razorpay, SEBI-gated advice, etc.) and exactly what's real vs. simulated.

## Quickstart

Requires Node 20+ and [pnpm](https://pnpm.io) (`npm i -g pnpm`). No Docker, Postgres, or Redis needed — everything runs locally with SQLite.

```bash
pnpm install
pnpm --filter @pulse/web db:migrate   # creates apps/web/prisma/dev.db and applies the schema
pnpm --filter @pulse/web db:seed      # seeds a demo tenant with ~4.5 years of realistic ledger history
pnpm dev                              # starts the Next.js app on http://localhost:3000
```

Sign in at `/signin` with **demo@pulse.app** (or any email — it's passwordless; no real email is sent, see `QUESTIONS.md` #7). You'll land on a "Dev Inbox" screen with a one-click sign-in link.

## Everyday commands

```bash
pnpm dev                 # dev server
pnpm build                # production build (all packages)
pnpm start                 # production server (after build)
pnpm test                  # calc-engine golden-value tests + ingestion/billing idempotency tests
pnpm typecheck              # strict TS across the whole workspace
pnpm --filter @pulse/web db:reset   # wipe and re-seed the local database
```

## Layout

```
apps/web/          Next.js (App Router) — the entire UI + API (route handlers) + Prisma schema
packages/calc-engine/    XIRR/TWRR/CAGR/risk math — pure functions, no I/O, golden-value tested
packages/shared-types/   Canonical ledger types, region config, pricing plans
QUESTIONS.md         Every assumption/simplification made building this, and why
```
