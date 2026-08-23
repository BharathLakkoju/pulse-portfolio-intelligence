import Link from "next/link";

const NAV = [
  { href: "/overview", label: "Overview", icon: "◈" },
  { href: "/portfolio/holdings", label: "Portfolio", icon: "▤" },
  { href: "/analyze/allocation", label: "Analyze", icon: "◐" },
  { href: "/plan/goals", label: "Plan", icon: "◎" },
  { href: "/tax", label: "Tax", icon: "▦" },
  { href: "/reports", label: "Reports", icon: "▧" },
  { href: "/connections", label: "Connections", icon: "⇄" },
  { href: "/ai", label: "Ask Pulse", icon: "✦" },
  { href: "/settings/profile", label: "Settings", icon: "⚙" },
];

export function Sidebar({ portfolioId }: { portfolioId?: string }) {
  const qs = portfolioId ? `?portfolio=${portfolioId}` : "";
  return (
    <aside className="hidden w-56 shrink-0 border-r border-pulse-border bg-pulse-surface md:block">
      <div className="flex h-14 items-center gap-2 border-b border-pulse-border px-4">
        <span className="text-lg font-bold text-pulse-accent">Pulse</span>
        <span className="text-[10px] text-pulse-muted">Portfolio Intelligence</span>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={`${item.href}${qs}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-pulse-muted hover:bg-pulse-surfaceAlt hover:text-pulse-text"
          >
            <span className="w-4 text-center" aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
