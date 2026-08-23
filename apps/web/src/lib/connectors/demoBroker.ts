import type { ConnectorDefinition } from "./types";
import { mulberry32, hashSeed } from "../random";
import { addDays } from "../dates";

const DEMO_STOCKS = [
  { symbol: "RELIANCE", exchange: "NSE", price: 2900 },
  { symbol: "HDFCBANK", exchange: "NSE", price: 1650 },
  { symbol: "INFY", exchange: "NSE", price: 1850 },
  { symbol: "TCS", exchange: "NSE", price: 4100 },
  { symbol: "ICICIBANK", exchange: "NSE", price: 1150 },
  { symbol: "ITC", exchange: "NSE", price: 460 },
];

export const demoBrokerConnector: ConnectorDefinition = {
  id: "demo_broker",
  displayName: "Demo Broker (simulated)",
  kind: "broker",
  isDemo: true,
  scopes: [
    { id: "read_holdings", label: "View holdings and positions", readOnly: true },
    { id: "read_transactions", label: "View order and trade history", readOnly: true },
    { id: "read_profile", label: "View linked account nickname", readOnly: true },
  ],
  async fetchTransactions(accountName: string) {
    const rand = mulberry32(hashSeed(accountName + "demo_broker"));
    const start = new Date("2022-04-01T09:30:00Z");
    const out = [];
    let day = 0;
    for (let i = 0; i < 24; i++) {
      day += Math.floor(rand() * 12) + 3;
      const stock = DEMO_STOCKS[Math.floor(rand() * DEMO_STOCKS.length)];
      const occurredAt = addDays(start, day);
      const qty = Math.floor(rand() * 15) + 1;
      const priceDrift = 1 + (rand() - 0.4) * 0.5;
      const price = Math.round(stock.price * priceDrift * 100) / 100;
      const gross = Math.round(qty * price * 100) / 100;
      out.push({
        sourceId: "demo_broker",
        sourceTransactionId: `demo-broker-${accountName}-buy-${i}`,
        occurredAt,
        eventType: "buy" as const,
        instrumentSymbol: stock.symbol,
        instrumentExchange: stock.exchange,
        quantity: String(qty),
        unitPrice: String(price),
        grossAmount: String(gross),
        feeAmount: String(Math.round(gross * 0.0005 * 100) / 100),
        taxAmount: String(Math.round(gross * 0.0001 * 100) / 100),
        currency: "INR",
        accountName,
        parseConfidence: 1,
        reconciliationState: "clean",
      });
    }
    return out;
  },
};
