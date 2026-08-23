/** Deterministic seeded PRNG (mulberry32) — used only for generating clearly-labeled demo/synthetic data. */
export function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

/** Box-Muller standard normal draw from a uniform PRNG. */
export function normalRandom(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Deterministic geometric-random-walk daily price series — used only for
 * clearly-labeled synthetic/demo pricing (see QUESTIONS.md #4), never
 * presented as real market data.
 */
export function generateRandomWalkSeries(opts: {
  seed: number;
  startDate: Date;
  endDate: Date;
  startPrice: number;
  annualDrift: number;
  annualVolatility: number;
}): Array<{ date: Date; price: number }> {
  const rand = mulberry32(opts.seed);
  const out: Array<{ date: Date; price: number }> = [];
  let price = opts.startPrice;
  const cursor = new Date(opts.startDate);
  const dailyDrift = opts.annualDrift / 365;
  const dailyVol = opts.annualVolatility / Math.sqrt(365);
  while (cursor <= opts.endDate) {
    const z = normalRandom(rand);
    price = price * Math.exp(dailyDrift - 0.5 * dailyVol * dailyVol + dailyVol * z);
    out.push({ date: new Date(cursor), price: Math.max(price, 0.0001) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/** Smooth compounding series (used for fixed-deposit accrual — no market volatility). */
export function generateSmoothSeries(opts: { startDate: Date; endDate: Date; startPrice: number; annualRate: number }): Array<{ date: Date; price: number }> {
  const out: Array<{ date: Date; price: number }> = [];
  const cursor = new Date(opts.startDate);
  while (cursor <= opts.endDate) {
    const years = (cursor.getTime() - opts.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    out.push({ date: new Date(cursor), price: opts.startPrice * Math.pow(1 + opts.annualRate, years) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}
