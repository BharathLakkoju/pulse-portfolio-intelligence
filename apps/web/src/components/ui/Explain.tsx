import type { MetricExplainability } from "@pulse/shared-types";
import { formatDate } from "@/lib/format";

/**
 * Every user-visible metric must be able to show its formula, date range,
 * FX approach, benchmark, annualisation, included/excluded accounts, and
 * data-quality warnings on demand — CLAUDE.md principle 2 / Instructions.md
 * §5. This renders that payload as a small expandable "how this is
 * calculated" block next to the number.
 */
export function ExplainBlock({ explain, unavailableReason }: { explain: MetricExplainability; unavailableReason?: string | null }) {
  return (
    <details className="group mt-1 text-xs text-pulse-muted">
      <summary className="cursor-pointer select-none text-pulse-accent hover:underline">How is this calculated?</summary>
      <div className="mt-2 space-y-1 rounded-lg border border-pulse-border bg-pulse-surfaceAlt p-3">
        {unavailableReason && <p className="text-pulse-warn">Unavailable: {unavailableReason}</p>}
        <p>
          <span className="text-pulse-text/80">Formula:</span> {explain.formula}
        </p>
        {(explain.dateRangeStart || explain.dateRangeEnd) && (
          <p>
            <span className="text-pulse-text/80">Date range:</span> {explain.dateRangeStart ? formatDate(explain.dateRangeStart) : "inception"} –{" "}
            {explain.dateRangeEnd ? formatDate(explain.dateRangeEnd) : "now"}
          </p>
        )}
        <p>
          <span className="text-pulse-text/80">Base currency / FX:</span> {explain.baseCurrency} — {explain.fxApproach}
        </p>
        {explain.benchmark && (
          <p>
            <span className="text-pulse-text/80">Benchmark:</span> {explain.benchmark}
          </p>
        )}
        {explain.riskFreeRateAssumption !== null && explain.riskFreeRateAssumption !== undefined && (
          <p>
            <span className="text-pulse-text/80">Risk-free rate assumption:</span> {(explain.riskFreeRateAssumption * 100).toFixed(2)}%
          </p>
        )}
        {explain.annualisationMethod && (
          <p>
            <span className="text-pulse-text/80">Annualisation:</span> {explain.annualisationMethod}
          </p>
        )}
        {explain.dataQualityWarnings.length > 0 && (
          <p className="text-pulse-warn">Data quality: {explain.dataQualityWarnings.join(" ")}</p>
        )}
        <p className="text-pulse-muted/70">As of {formatDate(explain.asOf, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </details>
  );
}
