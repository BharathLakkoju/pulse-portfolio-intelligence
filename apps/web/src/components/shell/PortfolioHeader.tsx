import { PortfolioSwitcher } from "./PortfolioSwitcher";

export function PortfolioHeader({
  title,
  subtitle,
  portfolios,
  activeId,
  action,
}: {
  title: string;
  subtitle?: string;
  portfolios: Array<{ id: string; name: string }>;
  activeId: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-pulse-text">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-pulse-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {portfolios.length > 0 && <PortfolioSwitcher portfolios={portfolios} activeId={activeId} />}
        {action}
      </div>
    </div>
  );
}
