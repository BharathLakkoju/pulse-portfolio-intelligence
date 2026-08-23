export interface DriftInput {
  category: string;
  actualWeight: number; // 0..1
  targetWeight: number; // 0..1
}

export interface DriftResult {
  category: string;
  actualWeight: number;
  targetWeight: number;
  drift: number; // actual - target, can be negative
  absDrift: number;
  breachesThreshold: boolean;
}

/** Allocation drift = Actual Weight - Target Weight, per category (CLAUDE.md). */
export function allocationDrift(inputs: DriftInput[], thresholdPct = 5): DriftResult[] {
  return inputs.map((i) => {
    const drift = i.actualWeight - i.targetWeight;
    return {
      category: i.category,
      actualWeight: i.actualWeight,
      targetWeight: i.targetWeight,
      drift,
      absDrift: Math.abs(drift),
      breachesThreshold: Math.abs(drift) * 100 >= thresholdPct,
    };
  });
}
