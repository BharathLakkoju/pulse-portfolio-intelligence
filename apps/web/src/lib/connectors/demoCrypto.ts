import type { ConnectorDefinition } from "./types";
import { mulberry32, hashSeed } from "../random";
import { addDays } from "../dates";

const DEMO_COINS = [
  { symbol: "BTC", price: 5500000 },
  { symbol: "ETH", price: 320000 },
  { symbol: "SOL", price: 14000 },
];

export const demoCryptoConnector: ConnectorDefinition = {
  id: "demo_crypto_exchange",
  displayName: "Demo Crypto Exchange (simulated)",
  kind: "crypto_exchange",
  isDemo: true,
  scopes: [
    { id: "read_balances", label: "View balances", readOnly: true },
    { id: "read_transactions", label: "View trade and deposit history", readOnly: true },
  ],
  async fetchTransactions(accountName: string) {
    const rand = mulberry32(hashSeed(accountName + "demo_crypto"));
    const start = new Date("2022-06-01T00:00:00Z");
    const out = [];
    let day = 0;
    for (let i = 0; i < 12; i++) {
      day += Math.floor(rand() * 20) + 5;
      const coin = DEMO_COINS[Math.floor(rand() * DEMO_COINS.length)];
      const occurredAt = addDays(start, day);
      // Size each buy by a target INR notional (typical modest retail DCA amount)
      // rather than a random coin quantity, so crypto doesn't dominate the demo
      // portfolio purely because BTC/ETH are priced in the hundreds of thousands.
      const priceDrift = 1 + (rand() - 0.35) * 0.6;
      const price = Math.round(coin.price * priceDrift);
      const targetNotional = 6000 + rand() * 12000;
      const qty = Math.round((targetNotional / price) * 1e6) / 1e6;
      const gross = Math.round(qty * price * 100) / 100;
      out.push({
        sourceId: "demo_crypto_exchange",
        sourceTransactionId: `demo-crypto-${accountName}-buy-${i}`,
        occurredAt,
        eventType: "buy" as const,
        instrumentSymbol: coin.symbol,
        instrumentExchange: "CRYPTO",
        quantity: String(qty),
        unitPrice: String(price),
        grossAmount: String(gross),
        feeAmount: String(Math.round(gross * 0.001 * 100) / 100),
        taxAmount: "0",
        currency: "INR",
        accountName,
        parseConfidence: 1,
        reconciliationState: "clean",
      });
    }
    // One staking reward event for realism.
    out.push({
      sourceId: "demo_crypto_exchange",
      sourceTransactionId: `demo-crypto-${accountName}-staking-0`,
      occurredAt: addDays(start, day + 30),
      eventType: "staking_reward" as const,
      instrumentSymbol: "ETH",
      instrumentExchange: "CRYPTO",
      quantity: "0.01",
      unitPrice: String(DEMO_COINS[1].price),
      grossAmount: String(Math.round(0.01 * DEMO_COINS[1].price * 100) / 100),
      feeAmount: "0",
      taxAmount: "0",
      currency: "INR",
      accountName,
      parseConfidence: 1,
      reconciliationState: "clean",
    });
    return out;
  },
};

export const CONNECTOR_REGISTRY_IDS = ["demo_broker", "demo_crypto_exchange"] as const;
