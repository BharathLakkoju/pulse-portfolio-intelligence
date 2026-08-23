import Link from "next/link";

export function SubNav({ items, activeHref, portfolioId }: { items: Array<{ href: string; label: string }>; activeHref: string; portfolioId?: string }) {
  const qs = portfolioId ? `?portfolio=${portfolioId}` : "";
  return (
    <div className="mb-4 flex gap-1 border-b border-pulse-border pb-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={`${item.href}${qs}`}
          className={`rounded-lg px-3 py-1.5 text-sm ${activeHref === item.href ? "bg-pulse-accentSoft text-pulse-accent" : "text-pulse-muted hover:bg-pulse-surfaceAlt"}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
