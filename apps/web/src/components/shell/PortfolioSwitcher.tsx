"use client";

import { useRouter, usePathname } from "next/navigation";

export function PortfolioSwitcher({ portfolios, activeId }: { portfolios: Array<{ id: string; name: string }>; activeId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      className="rounded-lg border border-pulse-border bg-pulse-surfaceAlt px-2 py-1.5 text-sm text-pulse-text"
      value={activeId}
      onChange={(e) => router.push(`${pathname}?portfolio=${e.target.value}`)}
      aria-label="Active portfolio"
    >
      {portfolios.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
