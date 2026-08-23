import Decimal from "decimal.js";

export interface PnlInputs {
  currentValue: string | number;
  realizedProceeds: string | number;
  income: string | number;
  netContributions: string | number;
  fees: string | number;
  taxes: string | number;
}

export interface PnlBreakdown {
  currentValue: string;
  realizedProceeds: string;
  income: string;
  netContributions: string;
  fees: string;
  taxes: string;
  totalPnl: string;
}

/**
 * P&L = Current Value + Realized Proceeds + Income - Net Contributions - Fees - Taxes
 * (CLAUDE.md "Money math reference"). Uses decimal.js throughout — never floats.
 */
export function computePnl(inputs: PnlInputs): PnlBreakdown {
  const currentValue = new Decimal(inputs.currentValue);
  const realizedProceeds = new Decimal(inputs.realizedProceeds);
  const income = new Decimal(inputs.income);
  const netContributions = new Decimal(inputs.netContributions);
  const fees = new Decimal(inputs.fees);
  const taxes = new Decimal(inputs.taxes);

  const totalPnl = currentValue
    .plus(realizedProceeds)
    .plus(income)
    .minus(netContributions)
    .minus(fees)
    .minus(taxes);

  return {
    currentValue: currentValue.toFixed(2),
    realizedProceeds: realizedProceeds.toFixed(2),
    income: income.toFixed(2),
    netContributions: netContributions.toFixed(2),
    fees: fees.toFixed(2),
    taxes: taxes.toFixed(2),
    totalPnl: totalPnl.toFixed(2),
  };
}

export function simpleReturnPct(investedValue: string | number, currentValue: string | number): number | null {
  const invested = new Decimal(investedValue);
  if (invested.isZero()) return null;
  const current = new Decimal(currentValue);
  return current.minus(invested).dividedBy(invested).times(100).toNumber();
}

export function sumDecimal(values: Array<string | number>): string {
  const total = values.reduce((acc: Decimal, v) => acc.plus(new Decimal(v)), new Decimal(0));
  return total.toFixed(2);
}
