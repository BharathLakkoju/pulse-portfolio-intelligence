import { GENERIC_DISCLAIMER } from "@/lib/compliance";

export function Disclaimer({ text = GENERIC_DISCLAIMER }: { text?: string }) {
  return (
    <p className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-3 py-2 text-xs text-pulse-muted">
      <span className="font-medium text-pulse-text/80">Not investment advice. </span>
      {text}
    </p>
  );
}

export function DemoBanner({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-pulse-warn/40 bg-pulse-warn/10 px-3 py-2 text-xs text-pulse-warn">
      <span className="font-semibold">DEMO DATA — </span>
      {text}
    </div>
  );
}

export function PriceLabelBadge({ label }: { label: string }) {
  const map: Record<string, { text: string; tone: "neutral" | "good" | "warn" | "bad" }> = {
    live: { text: "Live", tone: "good" },
    delayed: { text: "Delayed", tone: "neutral" },
    eod: { text: "End of day", tone: "neutral" },
    stale: { text: "Stale", tone: "warn" },
    unavailable: { text: "Unavailable", tone: "bad" },
    synthetic: { text: "Simulated pricing", tone: "warn" },
  };
  const meta = map[label] ?? { text: label, tone: "neutral" as const };
  const toneCls = {
    neutral: "text-pulse-muted border-pulse-border",
    good: "text-pulse-good border-pulse-good/30",
    warn: "text-pulse-warn border-pulse-warn/30",
    bad: "text-pulse-bad border-pulse-bad/30",
  }[meta.tone];
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${toneCls}`}>{meta.text}</span>;
}
