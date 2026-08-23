export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-pulse-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-pulse-accent">Pulse</div>
          <div className="text-xs text-pulse-muted">Your Portfolio Intelligence</div>
        </div>
        {children}
      </div>
    </div>
  );
}
