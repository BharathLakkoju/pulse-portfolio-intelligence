Here's the full list of what this project needs from you, based on what's already flagged in `QUESTIONS.md` as simulated/stubbed. For each item I've noted a free/open-source fallback in case something's not affordable right now — the codebase is already structured so these are drop-in swaps (adapter interfaces), not rewrites.

**1. Broker / exchange connectivity**
- Needed: Commercial API access to a broker (e.g., Zerodha Kite Connect, Upstox) and/or crypto exchange (e.g., CCXT-supported exchange keys).
- If unaffordable: Zerodha Kite Connect has a paid API (~₹2000/month); free alternative is to lean on CSV/CAS statement import only (already the real ingestion path) and skip live broker sync for now.

**2. Market data / FX feed**
- Needed: A licensed redistribution-rights data provider (e.g., a paid NSE/BSE data vendor, or a forex API with commercial terms).
- Free/OSS alternative: yfinance (Yahoo Finance, unofficial/free), NSE's own public but non-redistributable endpoints (personal use only), exchangerate-api.com free tier, or Alpha Vantage free tier (rate-limited). These come with usage caveats you'd need to accept knowingly.

**3. Sample CAS/brokerage statement PDFs**
- Needed: A few real (or realistic dummy) NSDL/CDSL CAS PDFs, or brokerage contract notes, to build and tune a parser against actual layouts.
- No paid alternative needed — just needs you to supply sample files (can be anonymized/dummy data).

**4. Payments (Razorpay)**
- Needed: A Razorpay merchant account + API keys (KYC required, free to create but needs business/bank details).
- Free alternative: keep running the local simulated billing state machine indefinitely for demo purposes; no OSS payment gateway is a real substitute for a compliant Indian payment rail.

**5. Email delivery (magic links, digests)**
- Needed: An SMTP provider or transactional email API.
- Free/OSS alternative: Resend, Brevo (Sendinblue), or Mailgun all have free tiers (few hundred emails/month); or self-hosted SMTP via something like a free-tier AWS SES sandbox.

**6. OAuth / passkeys / MFA**
- Needed: Google/Apple OAuth client IDs (Google Cloud Console and Apple Developer Program — Apple's costs $99/year).
- Free alternative: Google OAuth client registration is free; skip Apple Sign-In until budget allows; WebAuthn/passkeys and TOTP MFA are pure open protocols/libraries (e.g., `simplewebauthn`, `otpauth`) — no cost at all, just implementation time.

**7. Encryption / KMS**
- Needed (for production): A managed KMS (AWS KMS, GCP Cloud KMS) for key rotation/HSM backing.
- Free alternative: keep the current local AES-256-GCM dev-key approach for as long as it's not handling real user secrets in production; HashiCorp Vault OSS edition is a free self-hosted alternative to managed KMS.

**8. AI Portfolio Explainer (LLM)**
- Needed: An LLM API key (Anthropic/OpenAI) if you want free-form natural-language Q&A instead of the current rule-based template answers.
- Free/OSS alternative: a self-hosted open-weight model (e.g., Llama or Mistral via Ollama) run locally, or simply keep the current zero-cost rule-based explainer — it already covers the PRD's allowed question set with no hallucination risk.

**9. Legal / compliance**
- Needed: A CA (chartered accountant) to review the India tax-calculation logic before it's trusted for real filings; legal counsel on SEBI Investment-Adviser (RIA) registration if you ever want to offer personalized advice (not just analytics).
- No technical alternative — this one genuinely requires a human professional; can't be simulated away, only clearly labeled as unreviewed (already done).

**10. Hosting / infra / domain**
- Needed: A production host, a domain name, TLS certificate, Postgres + Redis instances at production scale.
- Free/OSS alternative: Postgres and Redis are already free/OSS to self-host; TLS certs are free via Let's Encrypt; hosting has generous free tiers on Railway, Render, Fly.io, or a Vercel free tier for the Next.js app; domain names are the one unavoidable small recurring cost (~$10-15/year), though you could defer with a free subdomain during dev.

**11. Design/branding assets** (if you want this to look like a real product rather than default styling)
- Needed: Logo, brand colors/name clearance, app icons.
- Free alternative: OSS icon sets (Lucide, Heroicons) and a simple palette are already usable at zero cost; skip custom branding until later.

Bottom line: nothing here blocks continued development — the codebase already isolates every one of these behind an adapter/interface specifically so you can defer real credentials indefinitely and keep working against the free/simulated versions.