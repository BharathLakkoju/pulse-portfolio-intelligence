import type { ConnectorDefinition } from "./types";
import { demoBrokerConnector } from "./demoBroker";
import { demoCryptoConnector } from "./demoCrypto";

export const CONNECTORS: Record<string, ConnectorDefinition> = {
  demo_broker: demoBrokerConnector,
  demo_crypto_exchange: demoCryptoConnector,
};

export function listConnectors(): ConnectorDefinition[] {
  return Object.values(CONNECTORS);
}

export function getConnector(id: string): ConnectorDefinition | null {
  return CONNECTORS[id] ?? null;
}
