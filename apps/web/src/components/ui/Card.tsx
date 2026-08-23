import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <div className={clsx("rounded-xl border border-pulse-border bg-pulse-surface p-5", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-pulse-text">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatTile({ label, value, sub, tooltip }: { label: string; value: ReactNode; sub?: ReactNode; tooltip?: string }) {
  return (
    <div className="rounded-xl border border-pulse-border bg-pulse-surface p-4" title={tooltip}>
      <div className="text-xs uppercase tracking-wide text-pulse-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-pulse-text">{value}</div>
      {sub && <div className="mt-1 text-xs text-pulse-muted">{sub}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "warn" | "accent" }) {
  const toneCls = {
    neutral: "bg-pulse-surfaceAlt text-pulse-muted border-pulse-border",
    good: "bg-pulse-good/10 text-pulse-good border-pulse-good/30",
    bad: "bg-pulse-bad/10 text-pulse-bad border-pulse-bad/30",
    warn: "bg-pulse-warn/10 text-pulse-warn border-pulse-warn/30",
    accent: "bg-pulse-accent/10 text-pulse-accent border-pulse-accent/30",
  }[tone];
  return <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", toneCls)}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-pulse-border p-8 text-center">
      <p className="text-sm font-medium text-pulse-text">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-pulse-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
