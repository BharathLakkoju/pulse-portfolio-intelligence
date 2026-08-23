/* Seeds a fully-populated demo tenant so every screen has real, internally
 * consistent data on first run. See QUESTIONS.md #12. All prices/benchmarks
 * are synthetic (QUESTIONS.md #4); broker/exchange transactions come from
 * the demo connectors (QUESTIONS.md #3). */
import { db } from "../src/lib/db";
import { generateRandomWalkSeries, generateSmoothSeries } from "../src/lib/random";
import { ingestTransactions, type IngestableTransaction } from "../src/lib/ingest";
import { getConnector } from "../src/lib/connectors/registry";
import { recomputeSnapshots } from "../src/lib/snapshots";
import { persistTaxLots } from "../src/lib/tax";
import { evaluateAlertsForUser } from "../src/lib/alerts";
import { addDays } from "../src/lib/dates";

const START_DATE = new Date("2022-01-03T00:00:00Z");
const TODAY = new Date();

interface SeedInstrument {
  symbol: string;
  exchange: string;
  name: string;
  assetClass: string;
  sector: string | null;
  country: string;
  currency: string;
  startPrice: number;
  annualDrift: number;
  annualVolatility: number;
}

const INSTRUMENTS: SeedInstrument[] = [
  { symbol: "RELIANCE", exchange: "NSE", name: "Reliance Industries Ltd", assetClass: "equity", sector: "Energy", country: "IN", currency: "INR", startPrice: 2450, annualDrift: 0.13, annualVolatility: 0.22 },
  { symbol: "HDFCBANK", exchange: "NSE", name: "HDFC Bank Ltd", assetClass: "equity", sector: "Financials", country: "IN", currency: "INR", startPrice: 1450, annualDrift: 0.12, annualVolatility: 0.2 },
  { symbol: "ICICIBANK", exchange: "NSE", name: "ICICI Bank Ltd", assetClass: "equity", sector: "Financials", country: "IN", currency: "INR", startPrice: 780, annualDrift: 0.14, annualVolatility: 0.21 },
  { symbol: "INFY", exchange: "NSE", name: "Infosys Ltd", assetClass: "equity", sector: "Information Technology", country: "IN", currency: "INR", startPrice: 1650, annualDrift: 0.1, annualVolatility: 0.24 },
  { symbol: "TCS", exchange: "NSE", name: "Tata Consultancy Services Ltd", assetClass: "equity", sector: "Information Technology", country: "IN", currency: "INR", startPrice: 3450, annualDrift: 0.1, annualVolatility: 0.2 },
  { symbol: "ITC", exchange: "NSE", name: "ITC Ltd", assetClass: "equity", sector: "Consumer Staples", country: "IN", currency: "INR", startPrice: 320, annualDrift: 0.15, annualVolatility: 0.19 },
  { symbol: "LT", exchange: "NSE", name: "Larsen & Toubro Ltd", assetClass: "equity", sector: "Industrials", country: "IN", currency: "INR", startPrice: 1950, annualDrift: 0.16, annualVolatility: 0.23 },
  { symbol: "SBIN", exchange: "NSE", name: "State Bank of India", assetClass: "equity", sector: "Financials", country: "IN", currency: "INR", startPrice: 490, annualDrift: 0.15, annualVolatility: 0.25 },
  { symbol: "BHARTIARTL", exchange: "NSE", name: "Bharti Airtel Ltd", assetClass: "equity", sector: "Telecommunications", country: "IN", currency: "INR", startPrice: 720, annualDrift: 0.18, annualVolatility: 0.22 },
  { symbol: "KOTAKBANK", exchange: "NSE", name: "Kotak Mahindra Bank Ltd", assetClass: "equity", sector: "Financials", country: "IN", currency: "INR", startPrice: 1780, annualDrift: 0.09, annualVolatility: 0.21 },
  { symbol: "HINDUNILVR", exchange: "NSE", name: "Hindustan Unilever Ltd", assetClass: "equity", sector: "Consumer Staples", country: "IN", currency: "INR", startPrice: 2350, annualDrift: 0.08, annualVolatility: 0.17 },
  { symbol: "ASIANPAINT", exchange: "NSE", name: "Asian Paints Ltd", assetClass: "equity", sector: "Materials", country: "IN", currency: "INR", startPrice: 3100, annualDrift: 0.06, annualVolatility: 0.2 },
  { symbol: "TITAN", exchange: "NSE", name: "Titan Company Ltd", assetClass: "equity", sector: "Consumer Discretionary", country: "IN", currency: "INR", startPrice: 2400, annualDrift: 0.17, annualVolatility: 0.24 },
  { symbol: "AXISBANK", exchange: "NSE", name: "Axis Bank Ltd", assetClass: "equity", sector: "Financials", country: "IN", currency: "INR", startPrice: 720, annualDrift: 0.14, annualVolatility: 0.23 },
  { symbol: "NIFTYBEES", exchange: "NSE", name: "Nippon India ETF Nifty BeES", assetClass: "etf", sector: "Broad Market", country: "IN", currency: "INR", startPrice: 180, annualDrift: 0.12, annualVolatility: 0.18 },
  { symbol: "GOLDBEES", exchange: "NSE", name: "Nippon India ETF Gold BeES", assetClass: "etf", sector: "Commodities", country: "IN", currency: "INR", startPrice: 45, annualDrift: 0.09, annualVolatility: 0.13 },
  { symbol: "PPFCF", exchange: "MF", name: "Parag Parikh Flexi Cap Fund (Direct-Growth)", assetClass: "mutual_fund", sector: "Diversified", country: "IN", currency: "INR", startPrice: 52, annualDrift: 0.14, annualVolatility: 0.19 },
  { symbol: "UTINIFTY", exchange: "MF", name: "UTI Nifty 50 Index Fund (Direct-Growth)", assetClass: "mutual_fund", sector: "Index", country: "IN", currency: "INR", startPrice: 110, annualDrift: 0.12, annualVolatility: 0.18 },
  { symbol: "SBISMALL", exchange: "MF", name: "SBI Small Cap Fund (Direct-Growth)", assetClass: "mutual_fund", sector: "Small Cap", country: "IN", currency: "INR", startPrice: 95, annualDrift: 0.16, annualVolatility: 0.28 },
  { symbol: "AAPL", exchange: "NASDAQ", name: "Apple Inc.", assetClass: "equity", sector: "Information Technology", country: "US", currency: "USD", startPrice: 172, annualDrift: 0.11, annualVolatility: 0.24 },
  { symbol: "MSFT", exchange: "NASDAQ", name: "Microsoft Corp.", assetClass: "equity", sector: "Information Technology", country: "US", currency: "USD", startPrice: 330, annualDrift: 0.13, annualVolatility: 0.22 },
  { symbol: "GOOGL", exchange: "NASDAQ", name: "Alphabet Inc. Class A", assetClass: "equity", sector: "Communication Services", country: "US", currency: "USD", startPrice: 138, annualDrift: 0.12, annualVolatility: 0.25 },
  { symbol: "BTC", exchange: "CRYPTO", name: "Bitcoin", assetClass: "crypto", sector: "Crypto", country: "GLOBAL", currency: "INR", startPrice: 1650000, annualDrift: 0.35, annualVolatility: 0.55 },
  { symbol: "ETH", exchange: "CRYPTO", name: "Ethereum", assetClass: "crypto", sector: "Crypto", country: "GLOBAL", currency: "INR", startPrice: 105000, annualDrift: 0.3, annualVolatility: 0.6 },
  { symbol: "SOL", exchange: "CRYPTO", name: "Solana", assetClass: "crypto", sector: "Crypto", country: "GLOBAL", currency: "INR", startPrice: 3500, annualDrift: 0.4, annualVolatility: 0.75 },
  { symbol: "GOLD", exchange: "OTHER", name: "Digital Gold (24K, per gram)", assetClass: "gold", sector: "Commodities", country: "IN", currency: "INR", startPrice: 5100, annualDrift: 0.1, annualVolatility: 0.12 },
];

const FD_INSTRUMENT: SeedInstrument = {
  symbol: "HDFCFD26",
  exchange: "OTHER",
  name: "HDFC Bank Fixed Deposit (36mo)",
  assetClass: "fixed_deposit",
  sector: "Cash & Equivalents",
  country: "IN",
  currency: "INR",
  startPrice: 1,
  annualDrift: 0,
  annualVolatility: 0,
};

const BENCHMARKS: Array<{ id: string; startPrice: number; annualDrift: number; annualVolatility: number }> = [
  { id: "NIFTY50", startPrice: 18100, annualDrift: 0.13, annualVolatility: 0.15 },
  { id: "NIFTY500", startPrice: 15500, annualDrift: 0.13, annualVolatility: 0.16 },
  { id: "SENSEX", startPrice: 60800, annualDrift: 0.13, annualVolatility: 0.15 },
  { id: "SP500", startPrice: 3850, annualDrift: 0.11, annualVolatility: 0.17 },
  { id: "MSCI_WORLD", startPrice: 2650, annualDrift: 0.1, annualVolatility: 0.16 },
  { id: "BTC", startPrice: 1650000, annualDrift: 0.35, annualVolatility: 0.55 },
];

async function seedInstrumentsAndPrices() {
  console.log("Seeding instrument master + synthetic price history...");
  const idBySymbol = new Map<string, string>();

  for (const inst of [...INSTRUMENTS, FD_INSTRUMENT]) {
    const row = await db.instrument.upsert({
      where: { symbol_exchange: { symbol: inst.symbol, exchange: inst.exchange } },
      create: { symbol: inst.symbol, exchange: inst.exchange, name: inst.name, assetClass: inst.assetClass, sector: inst.sector, country: inst.country, currency: inst.currency },
      update: {},
    });
    idBySymbol.set(`${inst.symbol}:${inst.exchange}`, row.id);

    const series =
      inst.symbol === "HDFCFD26"
        ? generateSmoothSeries({ startDate: START_DATE, endDate: TODAY, startPrice: 100000, annualRate: 0.071 })
        : generateRandomWalkSeries({
            seed: hashSeedLocal(inst.symbol + inst.exchange),
            startDate: START_DATE,
            endDate: TODAY,
            startPrice: inst.startPrice,
            annualDrift: inst.annualDrift,
            annualVolatility: inst.annualVolatility,
          });

    await db.priceHistory.deleteMany({ where: { instrumentId: row.id } });
    const BATCH = 500;
    for (let i = 0; i < series.length; i += BATCH) {
      await db.priceHistory.createMany({
        data: series.slice(i, i + BATCH).map((p) => ({ instrumentId: row.id, date: p.date, close: p.price.toFixed(4), source: "synthetic", isSynthetic: true })),
      });
    }
  }
  return idBySymbol;
}

function hashSeedLocal(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

async function seedBenchmarks() {
  console.log("Seeding synthetic benchmark price history...");
  for (const b of BENCHMARKS) {
    const series = generateRandomWalkSeries({
      seed: hashSeedLocal(b.id),
      startDate: START_DATE,
      endDate: TODAY,
      startPrice: b.startPrice,
      annualDrift: b.annualDrift,
      annualVolatility: b.annualVolatility,
    });
    await db.benchmarkPrice.deleteMany({ where: { benchmarkId: b.id } });
    const BATCH = 500;
    for (let i = 0; i < series.length; i += BATCH) {
      await db.benchmarkPrice.createMany({
        data: series.slice(i, i + BATCH).map((p) => ({ benchmarkId: b.id, date: p.date, close: p.price.toFixed(4), isSynthetic: true })),
      });
    }
  }
}

async function main() {
  console.log(`Seeding Pulse demo data (${START_DATE.toISOString().slice(0, 10)} -> ${TODAY.toISOString().slice(0, 10)})...`);

  await seedInstrumentsAndPrices();
  await seedBenchmarks();

  const user = await db.user.upsert({
    where: { email: "demo@pulse.app" },
    create: {
      email: "demo@pulse.app",
      name: "Demo Investor",
      country: "IN",
      taxResidency: "IN",
      baseCurrency: "INR",
      language: "en",
      investorProfile: "investor",
      onboardingComplete: true,
    },
    update: { onboardingComplete: true },
  });

  // Demo tenant is granted Premium so every gated screen (advanced risk, full
  // tax workspace, higher AI limits) is visible without a checkout step.
  await db.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, planId: "premium", status: "active", interval: "yearly", currency: "INR", isTestMode: true, currentPeriodEnd: addDays(TODAY, 365) },
    update: { planId: "premium", status: "active", currentPeriodEnd: addDays(TODAY, 365) },
  });
  await db.invoice.deleteMany({ where: { userId: user.id } });
  await db.invoice.create({
    data: { userId: user.id, planId: "premium", amount: "8999", currency: "INR", status: "paid", razorpayOrderId: "local_order_seed", razorpayPaymentId: "local_payment_seed" },
  });

  const longTerm = await db.portfolio.upsert({
    where: { id: "seed-portfolio-long-term" },
    create: { id: "seed-portfolio-long-term", userId: user.id, name: "Long-Term Portfolio", baseCurrency: "INR", isDemo: true, dashboardKind: "long_term" },
    update: {},
  });
  const trading = await db.portfolio.upsert({
    where: { id: "seed-portfolio-trading" },
    create: { id: "seed-portfolio-trading", userId: user.id, name: "Trading Portfolio", baseCurrency: "INR", isDemo: true, dashboardKind: "trading" },
    update: {},
  });

  // Clear prior demo transactions/accounts for idempotent re-seeding.
  await db.transaction.deleteMany({ where: { portfolioId: { in: [longTerm.id, trading.id] } } });
  await db.account.deleteMany({ where: { portfolioId: { in: [longTerm.id, trading.id] } } });
  await db.targetAllocation.deleteMany({ where: { portfolioId: longTerm.id } });
  await db.goal.deleteMany({ where: { portfolioId: longTerm.id } });
  await db.documentUpload.deleteMany({ where: { portfolioId: longTerm.id } });

  const brokerAccount = await db.account.create({
    data: { portfolioId: longTerm.id, name: "Zerodha (Demo)", sourceType: "broker", provider: "demo_broker", currency: "INR", isReadOnly: true, isDemo: true, status: "healthy", lastSyncAt: TODAY },
  });
  const cryptoAccount = await db.account.create({
    data: { portfolioId: longTerm.id, name: "CoinDCX (Demo)", sourceType: "crypto_exchange", provider: "demo_crypto_exchange", currency: "INR", isReadOnly: true, isDemo: true, status: "healthy", lastSyncAt: TODAY },
  });
  const mfAccount = await db.account.create({
    data: { portfolioId: longTerm.id, name: "Manual — Mutual Funds", sourceType: "manual", provider: "manual", currency: "INR", isReadOnly: true, status: "healthy" },
  });
  const goldAccount = await db.account.create({
    data: { portfolioId: longTerm.id, name: "Manual — Gold", sourceType: "manual", provider: "manual", currency: "INR", isReadOnly: true, status: "healthy" },
  });
  const fdAccount = await db.account.create({
    data: { portfolioId: longTerm.id, name: "Manual — Fixed Deposits", sourceType: "manual", provider: "manual", currency: "INR", isReadOnly: true, status: "healthy" },
  });
  const tradingAccount = await db.account.create({
    data: { portfolioId: trading.id, name: "Manual — Trading Account", sourceType: "manual", provider: "manual", currency: "INR", isReadOnly: true, status: "reconnect_required" },
  });

  console.log("Ingesting demo connector transactions...");
  const brokerConnector = getConnector("demo_broker")!;
  const brokerTx = await brokerConnector.fetchTransactions(brokerAccount.name);
  await ingestTransactions(longTerm.id, brokerTx);

  const cryptoConnector = getConnector("demo_crypto_exchange")!;
  const cryptoTx = await cryptoConnector.fetchTransactions(cryptoAccount.name);
  await ingestTransactions(longTerm.id, cryptoTx);

  console.log("Ingesting manual SIP, dividend, sell, fee, tax, and corporate-action transactions...");
  const manualRows: IngestableTransaction[] = [];

  // Monthly SIP into two mutual funds for ~40 months.
  for (let m = 0; m < 40; m++) {
    const date = addDays(START_DATE, 5 + m * 30);
    if (date > TODAY) break;
    manualRows.push({
      sourceId: "manual",
      sourceTransactionId: `sip-ppfcf-${m}`,
      occurredAt: date,
      eventType: "buy",
      instrumentSymbol: "PPFCF",
      instrumentExchange: "MF",
      quantity: "96.15",
      unitPrice: "52",
      grossAmount: "5000",
      feeAmount: "0",
      taxAmount: "0",
      currency: "INR",
      accountName: mfAccount.name,
    });
    manualRows.push({
      sourceId: "manual",
      sourceTransactionId: `sip-utinifty-${m}`,
      occurredAt: date,
      eventType: "buy",
      instrumentSymbol: "UTINIFTY",
      instrumentExchange: "MF",
      quantity: "27.27",
      unitPrice: "110",
      grossAmount: "3000",
      feeAmount: "0",
      taxAmount: "0",
      currency: "INR",
      accountName: mfAccount.name,
    });
  }

  // Gold purchases every quarter.
  for (let q = 0; q < 12; q++) {
    const date = addDays(START_DATE, 40 + q * 90);
    if (date > TODAY) break;
    manualRows.push({
      sourceId: "manual",
      sourceTransactionId: `gold-${q}`,
      occurredAt: date,
      eventType: "buy",
      instrumentSymbol: "GOLD",
      instrumentExchange: "OTHER",
      quantity: "5",
      unitPrice: "5100",
      grossAmount: "25500",
      feeAmount: "150",
      taxAmount: "0",
      currency: "INR",
      accountName: goldAccount.name,
    });
  }

  // One fixed deposit.
  manualRows.push({
    sourceId: "manual",
    sourceTransactionId: "fd-1",
    occurredAt: addDays(START_DATE, 20),
    eventType: "buy",
    instrumentSymbol: "HDFCFD26",
    instrumentExchange: "OTHER",
    quantity: "1",
    unitPrice: "100000",
    grossAmount: "100000",
    feeAmount: "0",
    taxAmount: "0",
    currency: "INR",
    accountName: fdAccount.name,
  });

  // Dividends on a few large-cap holdings, twice a year.
  for (const [symbol, amountPerPayment] of [["RELIANCE", 3200], ["HDFCBANK", 1800], ["TCS", 4200], ["ITC", 2100]] as const) {
    for (let h = 0; h < 7; h++) {
      const date = addDays(START_DATE, 200 + h * 180);
      if (date > TODAY) break;
      manualRows.push({
        sourceId: "manual",
        sourceTransactionId: `div-${symbol}-${h}`,
        occurredAt: date,
        eventType: "dividend",
        instrumentSymbol: symbol,
        instrumentExchange: "NSE",
        quantity: "0",
        unitPrice: "0",
        grossAmount: String(amountPerPayment),
        feeAmount: "0",
        taxAmount: "0",
        currency: "INR",
        accountName: brokerAccount.name,
      });
    }
  }

  // A partial sell on RELIANCE to generate realized gains + closed tax lots.
  manualRows.push({
    sourceId: "manual",
    sourceTransactionId: "sell-reliance-1",
    occurredAt: addDays(START_DATE, 620),
    eventType: "sell",
    instrumentSymbol: "RELIANCE",
    instrumentExchange: "NSE",
    quantity: "8",
    unitPrice: "2650",
    grossAmount: "21200",
    feeAmount: "25",
    taxAmount: "12",
    currency: "INR",
    accountName: brokerAccount.name,
  });

  // A US-stock dividend with withholding tax, to exercise multi-currency + withholding.
  manualRows.push({
    sourceId: "manual",
    sourceTransactionId: "buy-aapl-1",
    occurredAt: addDays(START_DATE, 100),
    eventType: "buy",
    instrumentSymbol: "AAPL",
    instrumentExchange: "NASDAQ",
    quantity: "10",
    unitPrice: "172",
    grossAmount: "1720",
    feeAmount: "5",
    taxAmount: "0",
    currency: "USD",
    accountName: brokerAccount.name,
  });
  manualRows.push({
    sourceId: "manual",
    sourceTransactionId: "div-aapl-1",
    occurredAt: addDays(START_DATE, 280),
    eventType: "dividend",
    instrumentSymbol: "AAPL",
    instrumentExchange: "NASDAQ",
    quantity: "0",
    unitPrice: "0",
    grossAmount: "9.6",
    feeAmount: "0",
    taxAmount: "2.4",
    currency: "USD",
    accountName: brokerAccount.name,
  });

  // A brokerage account fee (no instrument).
  manualRows.push({
    sourceId: "manual",
    sourceTransactionId: "fee-annual-1",
    occurredAt: addDays(START_DATE, 365),
    eventType: "fee",
    instrumentSymbol: null,
    instrumentExchange: null,
    quantity: "0",
    unitPrice: "0",
    grossAmount: "590",
    feeAmount: "0",
    taxAmount: "0",
    currency: "INR",
    accountName: brokerAccount.name,
  });

  // Trading portfolio: a series of short-term round trips.
  const tradingRand = [
    { symbol: "SBIN", qtyIn: 40, priceIn: 560, qtyOut: 40, priceOut: 605, dayIn: 900, dayOut: 940 },
    { symbol: "AXISBANK", qtyIn: 25, priceIn: 880, qtyOut: 25, priceOut: 845, dayIn: 950, dayOut: 970 },
    { symbol: "ITC", qtyIn: 100, priceIn: 410, qtyOut: 100, priceOut: 452, dayIn: 1000, dayOut: 1035 },
    { symbol: "TITAN", qtyIn: 10, priceIn: 3100, qtyOut: 10, priceOut: 3340, dayIn: 1100, dayOut: 1140 },
  ];
  for (const t of tradingRand) {
    const dateIn = addDays(START_DATE, t.dayIn);
    const dateOut = addDays(START_DATE, t.dayOut);
    if (dateIn <= TODAY) {
      manualRows.push({
        sourceId: "manual",
        sourceTransactionId: `trade-${t.symbol}-in`,
        occurredAt: dateIn,
        eventType: "buy",
        instrumentSymbol: t.symbol,
        instrumentExchange: "NSE",
        quantity: String(t.qtyIn),
        unitPrice: String(t.priceIn),
        grossAmount: String(t.qtyIn * t.priceIn),
        feeAmount: String(Math.round(t.qtyIn * t.priceIn * 0.001)),
        taxAmount: "0",
        currency: "INR",
        accountName: tradingAccount.name,
      });
    }
    if (dateOut <= TODAY) {
      manualRows.push({
        sourceId: "manual",
        sourceTransactionId: `trade-${t.symbol}-out`,
        occurredAt: dateOut,
        eventType: "sell",
        instrumentSymbol: t.symbol,
        instrumentExchange: "NSE",
        quantity: String(t.qtyOut),
        unitPrice: String(t.priceOut),
        grossAmount: String(t.qtyOut * t.priceOut),
        feeAmount: String(Math.round(t.qtyOut * t.priceOut * 0.001)),
        taxAmount: String(Math.round(t.qtyOut * t.priceOut * 0.0005)),
        currency: "INR",
        accountName: tradingAccount.name,
      });
    }
  }

  const longTermManual = manualRows.filter((r) => [mfAccount.name, goldAccount.name, fdAccount.name, brokerAccount.name].includes(r.accountName));
  const tradingManual = manualRows.filter((r) => r.accountName === tradingAccount.name);

  const ingestResult1 = await ingestTransactions(longTerm.id, longTermManual);
  const ingestResult2 = await ingestTransactions(trading.id, tradingManual);
  console.log(`Ingested: broker=${brokerTx.length} crypto=${cryptoTx.length} long-term-manual=${ingestResult1.inserted} trading-manual=${ingestResult2.inserted}`);

  await db.targetAllocation.createMany({
    data: [
      { portfolioId: longTerm.id, category: "equity", targetWeight: 0.5 },
      { portfolioId: longTerm.id, category: "mutual_fund", targetWeight: 0.2 },
      { portfolioId: longTerm.id, category: "crypto", targetWeight: 0.1 },
      { portfolioId: longTerm.id, category: "gold", targetWeight: 0.1 },
      { portfolioId: longTerm.id, category: "fixed_deposit", targetWeight: 0.1 },
    ],
  });

  await db.goal.createMany({
    data: [
      {
        portfolioId: longTerm.id,
        name: "Retirement",
        type: "retirement",
        targetAmount: "50000000",
        targetDate: new Date("2050-01-01"),
        contributionAmount: "20000",
        contributionFrequency: "monthly",
        expectedReturnLow: 0.08,
        expectedReturnHigh: 0.13,
        inflationAssumption: 0.05,
        linkedAccountIds: [brokerAccount.id, mfAccount.id].join(","),
      },
      {
        portfolioId: longTerm.id,
        name: "Home Down Payment",
        type: "home",
        targetAmount: "3000000",
        targetDate: addDays(TODAY, 365 * 2),
        contributionAmount: "15000",
        contributionFrequency: "monthly",
        expectedReturnLow: 0.06,
        expectedReturnHigh: 0.09,
        inflationAssumption: 0.05,
        linkedAccountIds: mfAccount.id,
      },
    ],
  });

  await db.documentUpload.create({
    data: {
      portfolioId: longTerm.id,
      filename: "CAS_Statement_Mar2026.pdf",
      storageRef: "seed/CAS_Statement_Mar2026.pdf",
      status: "pending_review",
    },
  });

  await db.alertRule.deleteMany({ where: { userId: user.id } });
  await db.alertRule.createMany({
    data: [
      { userId: user.id, type: "drift", thresholdValue: 5, channel: "in_app", enabled: true, frequencyCap: "realtime" },
      { userId: user.id, type: "price_move", thresholdValue: 5, channel: "in_app", enabled: true, frequencyCap: "daily_digest" },
      { userId: user.id, type: "stale_sync", thresholdValue: null, channel: "email", enabled: true, frequencyCap: "daily_digest" },
    ],
  });

  console.log("Computing daily portfolio snapshots (this may take a little while)...");
  await recomputeSnapshots(longTerm.id, START_DATE, TODAY, "INR");
  await recomputeSnapshots(trading.id, addDays(START_DATE, 890), TODAY, "INR");

  console.log("Computing FIFO tax lots...");
  await persistTaxLots(longTerm.id);
  await persistTaxLots(trading.id);

  console.log("Evaluating initial alerts...");
  await evaluateAlertsForUser(user.id);

  console.log("Seed complete.");
  console.log(`Demo sign-in email: demo@pulse.app`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
